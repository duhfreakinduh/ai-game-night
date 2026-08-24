const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';

let generator = null;
let loading = null;
let activeBackend = null;
let lastErrorMessage = '';

const SMART_TWISTS = {
  math: ['Number ninja time!', 'Crack the number vault!', 'Math boss incoming!', 'Quick—beat the calculator!', 'Numbers are coming in hot!'],
  words: ['Word wizard challenge!', 'Vocabulary showdown!', 'Decode this word mission!', 'Language boss round!', 'Words are getting wild!'],
  science: ['Lab coats on!', 'Science mission activated!', 'Experiment time!', 'Professor mode engaged!', 'Unlock this science secret!'],
  world: ['Around the world we go!', 'Globe-trotter challenge!', 'Passport ready!', 'World explorer mission!', 'Map master time!'],
  history: ['Time-machine activated!', 'History mystery incoming!', 'Travel back in time!', 'Past meets present!', 'History boss round!'],
  bible: ['Bible quest activated!', 'Scripture challenge!', 'Bible explorer time!', 'Faith quest incoming!', 'Unlock this Bible clue!'],
};

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

function smartRemix(seed) {
  const choices = SMART_TWISTS[seed.c] || ['Game Master challenge!'];
  const twist = choices[Math.floor(Math.random() * choices.length)];
  return { ...seed, a: [...seed.a], q: `${twist} — ${seed.q}`, smart: true };
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
}

async function loadPipeline(pipeline, options, label, onProgress) {
  onProgress(`Loading Hugging Face AI on ${label}…`);
  generator = await pipeline('text-generation', MODEL_ID, {
    ...options,
    progress_callback: progressReporter(onProgress, label),
  });
  activeBackend = label;
  onProgress(`Hugging Face AI ready (${label}).`);
  return true;
}

export async function initAI(onProgress = () => {}) {
  if (generator) {
    onProgress(`Hugging Face AI ready (${activeBackend}).`);
    return true;
  }
  if (activeBackend === 'SMART') {
    onProgress('Smart Game Master ready. Hugging Face will retry after a page refresh.');
    return true;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      lastErrorMessage = '';
      onProgress('Starting Hugging Face AI… first download is cached on this phone.');
      const { pipeline, env } = await import(TRANSFORMERS_URL);
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const hasWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
      let lastError = null;

      if (hasWebGPU) {
        try {
          return await loadPipeline(pipeline, { device: 'webgpu', dtype: 'q4f16' }, 'GPU', onProgress);
        } catch (err) {
          lastError = err;
          console.warn('AI GPU failed:', err);
          await disposeGenerator();
          onProgress('GPU mode failed. Trying CPU mode…');
        }
      }

      try {
        return await loadPipeline(pipeline, { dtype: 'q4' }, 'CPU', onProgress);
      } catch (err) {
        lastError = err;
        console.warn('AI CPU failed:', err);
        await disposeGenerator();
      }

      throw lastError || new Error('No local AI backend was available');
    } catch (err) {
      lastErrorMessage = String(err?.message || err || 'Unknown AI startup error').slice(0, 180);
      activeBackend = 'SMART';
      onProgress('Smart Game Master active. This browser blocked the Hugging Face model, so Brain Bash switched automatically instead of failing.');
      return true;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function remixQuestion(seed, player) {
  if (!generator) return smartRemix(seed);

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
    if (!twist || twist.length < 3) return smartRemix(seed);
    return { ...seed, a: [...seed.a], q: `${twist} — ${seed.q}`, ai: true };
  } catch (err) {
    console.warn('AI twist failed, using smart fallback:', err);
    return smartRemix(seed);
  }
}

export function getAIStatus() {
  return { ready: !!generator || activeBackend === 'SMART', backend: activeBackend, model: MODEL_ID, error: lastErrorMessage };
}
