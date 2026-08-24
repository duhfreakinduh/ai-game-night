const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'onnx-community/gemma-3-270m-it-ONNX';

let generator = null;
let loading = null;
let activeBackend = null;

const normalize = (value) => String(value).trim().toLocaleLowerCase();

function outputText(output) {
  const generated = output?.[0]?.generated_text;
  if (typeof generated === 'string') return generated.trim();
  if (Array.isArray(generated)) {
    const last = generated.at(-1);
    if (typeof last === 'string') return last.trim();
    if (typeof last?.content === 'string') return last.content.trim();
  }
  return '';
}

function progressReporter(onProgress, backendLabel) {
  let lastPercent = -1;
  return (p) => {
    const value = Number(p?.progress);
    if (!Number.isFinite(value)) return;
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    if (percent === lastPercent) return;
    lastPercent = percent;
    onProgress(`AI ${backendLabel}: downloading ${percent}%`);
  };
}

async function disposeGenerator() {
  try {
    await generator?.dispose?.();
  } catch (err) {
    console.warn('AI cleanup warning:', err);
  }
  generator = null;
  activeBackend = null;
}

async function selfTest() {
  const output = await generator(
    [{ role: 'user', content: 'Reply with the single word READY.' }],
    { max_new_tokens: 8, do_sample: false }
  );
  if (!outputText(output)) throw new Error('AI self-test returned no text');
}

export async function initAI(onProgress = () => {}) {
  if (generator) {
    onProgress(`AI Game Master ready (${activeBackend}).`);
    return true;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      onProgress('Starting Hugging Face AI… first load is about 325 MB and is cached by your browser.');
      const { pipeline } = await import(TRANSFORMERS_URL);
      const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
      const attempts = hasWebGPU
        ? [
            { device: 'webgpu', dtype: 'q4', label: 'GPU' },
            { device: 'wasm', dtype: 'q4', label: 'CPU fallback' },
          ]
        : [{ device: 'wasm', dtype: 'q4', label: 'CPU' }];

      let lastError = null;
      for (const attempt of attempts) {
        try {
          onProgress(`Loading AI on ${attempt.label}…`);
          generator = await pipeline('text-generation', MODEL_ID, {
            device: attempt.device,
            dtype: attempt.dtype,
            progress_callback: progressReporter(onProgress, attempt.label),
          });
          activeBackend = attempt.label;
          onProgress(`Testing AI on ${attempt.label}…`);
          await selfTest();
          onProgress(`AI Game Master ready (${attempt.label}).`);
          return true;
        } catch (err) {
          lastError = err;
          console.warn(`AI ${attempt.label} failed:`, err);
          await disposeGenerator();
          if (attempt.device === 'webgpu') {
            onProgress('GPU AI did not start. Trying compatible CPU mode…');
          }
        }
      }

      throw lastError || new Error('No AI backend was available');
    } catch (err) {
      console.warn('AI unavailable:', err);
      await disposeGenerator();
      onProgress('AI could not start on this browser. Tap the AI switch to retry; the adaptive game still works.');
      return false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function remixQuestion(seed, player) {
  if (!generator) return null;

  const canonicalAnswer = String(seed.a[seed.x]);
  const messages = [
    {
      role: 'system',
      content: 'You are Brain Bash, a family-safe learning game master. Never change the factual answer. Output only valid JSON and no markdown.',
    },
    {
      role: 'user',
      content: `Rewrite this multiple-choice question for a ${player.label} player. Keep this exact correct answer text: ${JSON.stringify(canonicalAnswer)}. Keep four answer choices. Make it playful, clear, short, and age appropriate. Return JSON only with keys q, answers, correctIndex, hint. Seed: ${JSON.stringify(seed)}`,
    },
  ];

  try {
    const out = await generator(messages, {
      max_new_tokens: 150,
      temperature: 0.55,
      top_p: 0.9,
      do_sample: true,
    });
    const text = outputText(out);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.answers) || parsed.answers.length !== 4) return null;
    if (!Number.isInteger(parsed.correctIndex) || parsed.correctIndex < 0 || parsed.correctIndex > 3) return null;
    if (normalize(parsed.answers[parsed.correctIndex]) !== normalize(canonicalAnswer)) return null;

    const q = String(parsed.q || '').trim();
    const answers = parsed.answers.map((v) => String(v).trim());
    if (q.length < 4 || q.length > 240 || answers.some((a) => !a || a.length > 100)) return null;
    if (new Set(answers.map(normalize)).size !== 4) return null;

    return {
      c: seed.c,
      l: seed.l,
      q,
      a: answers,
      x: parsed.correctIndex,
      h: String(parsed.hint || seed.h).trim().slice(0, 180),
      ai: true,
    };
  } catch (err) {
    console.warn('AI remix failed:', err);
    return null;
  }
}

export function getAIStatus() {
  return { ready: !!generator, backend: activeBackend, model: MODEL_ID };
}
