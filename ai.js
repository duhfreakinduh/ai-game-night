const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'onnx-community/SmolLM2-135M-Instruct-ONNX-MHA';

let generator = null;
let loading = null;
let activeBackend = null;
let lastErrorMessage = '';

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
    [{ role: 'user', content: 'Reply with only READY.' }],
    { max_new_tokens: 8, do_sample: false }
  );
  const text = outputText(output);
  if (!text) throw new Error('AI self-test returned no text');
}

async function loadPipeline(pipeline, options, label, onProgress) {
  onProgress(`Loading lightweight AI on ${label}…`);
  generator = await pipeline('text-generation', MODEL_ID, {
    ...options,
    progress_callback: progressReporter(onProgress, label),
  });
  activeBackend = label;
  onProgress(`Testing AI on ${label}…`);
  await selfTest();
  onProgress(`AI Game Master ready (${label}).`);
  return true;
}

export async function initAI(onProgress = () => {}) {
  if (generator) {
    onProgress(`AI Game Master ready (${activeBackend}).`);
    return true;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      lastErrorMessage = '';
      onProgress('Starting lightweight Hugging Face AI… first load is cached on this phone.');
      const { pipeline } = await import(TRANSFORMERS_URL);
      const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
      let lastError = null;

      if (hasWebGPU) {
        try {
          return await loadPipeline(
            pipeline,
            { device: 'webgpu', dtype: 'q4f16' },
            'GPU',
            onProgress
          );
        } catch (err) {
          lastError = err;
          console.warn('AI GPU failed:', err);
          await disposeGenerator();
          onProgress('GPU mode did not start. Trying phone-compatible CPU mode…');
        }
      }

      try {
        // IMPORTANT: leaving device unset is the supported Transformers.js WASM/CPU path.
        return await loadPipeline(
          pipeline,
          { dtype: 'q8' },
          'CPU',
          onProgress
        );
      } catch (err) {
        lastError = err;
        console.warn('AI CPU failed:', err);
        await disposeGenerator();
      }

      throw lastError || new Error('No AI backend was available');
    } catch (err) {
      console.warn('AI unavailable:', err);
      await disposeGenerator();
      lastErrorMessage = String(err?.message || err || 'Unknown AI startup error').slice(0, 180);
      onProgress(`AI startup failed: ${lastErrorMessage}`);
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
      max_new_tokens: 120,
      temperature: 0.45,
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
  return {
    ready: !!generator,
    backend: activeBackend,
    model: MODEL_ID,
    error: lastErrorMessage,
  };
}
