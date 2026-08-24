const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';

let generator = null;
let loading = null;
let activeBackend = null;
let lastErrorMessage = '';

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

function cleanTwist(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*[-*"']+|[-*"']+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
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
  try { await generator?.dispose?.(); } catch (err) { console.warn('AI cleanup warning:', err); }
  generator = null;
  activeBackend = null;
}

async function loadPipeline(pipeline, options, label, onProgress) {
  onProgress(`Loading Hugging Face AI on ${label}…`);
  generator = await pipeline('text-generation', MODEL_ID, {
    ...options,
    progress_callback: progressReporter(onProgress, label),
  });
  activeBackend = label;
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
      onProgress('Starting Hugging Face AI… the first download is cached on this phone.');
      const { pipeline, env } = await import(TRANSFORMERS_URL);
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
      let lastError = null;

      // Hugging Face specifically recommends q4f16 for this model on WebGPU.
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
          onProgress('GPU mode failed. Trying compatible CPU mode…');
        }
      }

      // In browsers, omitting device uses the supported WASM/CPU path.
      try {
        return await loadPipeline(
          pipeline,
          { dtype: 'q4' },
          'CPU',
          onProgress
        );
      } catch (err) {
        lastError = err;
        console.warn('AI CPU failed:', err);
        await disposeGenerator();
      }

      throw lastError || new Error('No local AI backend was available');
    } catch (err) {
      console.warn('AI unavailable:', err);
      await disposeGenerator();
      lastErrorMessage = String(err?.message || err || 'Unknown AI startup error').slice(0, 180);
      onProgress(`Hugging Face AI failed: ${lastErrorMessage}`);
      return false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function remixQuestion(seed, player) {
  if (!generator) return null;

  // The model only creates flavor text. The vetted question, answers, and
  // correct index never leave the curated bank, so AI cannot corrupt facts.
  const prompt = `Write ONE short, fun game-show intro of at most 8 words for a ${player.label} player about to answer a ${seed.c} question. Do not reveal or hint at the answer. No quotes. No markdown. Intro only.`;

  try {
    const out = await generator(prompt, {
      max_new_tokens: 18,
      temperature: 0.9,
      top_p: 0.92,
      do_sample: true,
      return_full_text: false,
    });
    const twist = cleanTwist(outputText(out));
    if (!twist || twist.length < 3) return null;

    return {
      ...seed,
      a: [...seed.a],
      q: `${twist} — ${seed.q}`,
      ai: true,
    };
  } catch (err) {
    console.warn('AI twist failed:', err);
    return null;
  }
}

export function getAIStatus() {
  return { ready: !!generator, backend: activeBackend, model: MODEL_ID, error: lastErrorMessage };
}
