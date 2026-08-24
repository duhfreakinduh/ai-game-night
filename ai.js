const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_CANDIDATES = ['Xenova/bge-small-en-v1.5', 'Xenova/all-MiniLM-L6-v2'];

let embedder = null;
let loading = null;
let activeBackend = null;
let activeModel = null;

function progressReporter(onProgress) {
  let lastPercent = -1;
  return (p) => {
    const value = Number(p?.progress);
    if (!Number.isFinite(value)) return;
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    if (percent === lastPercent) return;
    lastPercent = percent;
    onProgress(`AI download ${percent}%`);
  };
}

async function embedTexts(texts) {
  if (!embedder || !texts.length) return [];
  const output = await embedder(texts, { pooling: 'mean', normalize: true });
  if (typeof output?.tolist === 'function') return output.tolist();
  if (Array.isArray(output)) return output;
  throw new Error('AI embedding output was not readable');
}

function dot(a, b) {
  let total = 0;
  const n = Math.min(a?.length || 0, b?.length || 0);
  for (let i = 0; i < n; i++) total += a[i] * b[i];
  return total;
}

async function selfTest() {
  const rows = await embedTexts(['Brain Bash learning game', 'A completely different sentence']);
  if (!Array.isArray(rows) || rows.length !== 2 || !Array.isArray(rows[0]) || rows[0].length < 32) {
    throw new Error('AI self-test returned invalid embeddings');
  }
}

async function loadModel(pipeline, onProgress) {
  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      onProgress(`Loading ${model.split('/').pop()}…`);
      const pipe = await pipeline('feature-extraction', model, {
        dtype: 'q8',
        progress_callback: progressReporter(onProgress),
      });
      embedder = pipe;
      activeModel = model;
      await selfTest();
      return true;
    } catch (err) {
      lastError = err;
      try { await embedder?.dispose?.(); } catch {}
      embedder = null;
      activeModel = null;
      console.warn(`Brain Bash could not load ${model}; trying fallback.`, err);
    }
  }
  throw lastError || new Error('No Hugging Face embedding model loaded');
}

export async function initAI(onProgress = () => {}) {
  if (embedder) {
    onProgress('AI Game Master ready — deep anti-repeat mode is ON.');
    return true;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      onProgress('Starting Hugging Face AI Game Master…');
      const { pipeline, env } = await import(TRANSFORMERS_URL);
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;

      await loadModel(pipeline, onProgress);
      activeBackend = navigator.gpu ? 'phone/browser • WebGPU available' : 'phone/browser CPU';
      onProgress('AI Game Master ready — deep anti-repeat mode is ON.');
      return true;
    } catch (err) {
      console.error('Brain Bash AI failed:', err);
      try { await embedder?.dispose?.(); } catch {}
      embedder = null;
      activeBackend = null;
      activeModel = null;
      const detail = String(err?.message || err || 'unknown error').slice(0, 140);
      onProgress(`AI load failed: ${detail}`);
      return false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

function shuffle(values) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function chooseWithAI(candidates, recentTexts = []) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  if (!embedder || candidates.length < 2) {
    return candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
  }

  // Look at far more possibilities than v1 did. A random sample prevents one fixed
  // ordering from becoming a hidden pattern while keeping mobile inference bounded.
  const sample = shuffle(candidates).slice(0, 32);
  const recent = recentTexts.filter(Boolean).slice(-30);
  if (!recent.length) {
    return { ...sample[Math.floor(Math.random() * sample.length)], aiPick: true };
  }

  try {
    const candidateTexts = sample.map(q => `${q.q} ${Array.isArray(q.a) ? q.a.join(' ') : ''}`);
    const vectors = await embedTexts([...candidateTexts, ...recent]);
    const candidateVectors = vectors.slice(0, sample.length);
    const recentVectors = vectors.slice(sample.length);

    // Maximal-diversity style score:
    // - strongly penalize resemblance to any recent question,
    // - lightly penalize generic resemblance to the whole recent set,
    // - lightly reward candidates that are unusual compared with the other choices.
    const scores = candidateVectors.map((vec, i) => {
      const similarities = recentVectors.map(old => dot(vec, old));
      const maxRecent = Math.max(...similarities);
      const avgRecent = similarities.reduce((a, b) => a + b, 0) / Math.max(1, similarities.length);

      let peerSimilarity = 0;
      let peerCount = 0;
      for (let j = 0; j < candidateVectors.length; j++) {
        if (j === i) continue;
        peerSimilarity += dot(vec, candidateVectors[j]);
        peerCount++;
      }
      const avgPeer = peerCount ? peerSimilarity / peerCount : 0;
      const tinyJitter = Math.random() * 0.012;
      const novelty = (1 - maxRecent) * 0.68 + (1 - avgRecent) * 0.22 + (1 - avgPeer) * 0.10 + tinyJitter;
      return { i, novelty, maxRecent };
    }).sort((a, b) => b.novelty - a.novelty);

    // If the best candidate is still extremely close to something recent and we
    // have alternatives, pick from the best few instead of repeating the near-copy.
    const shortlist = scores.filter(row => row.maxRecent < 0.88).slice(0, 5);
    const pool = shortlist.length ? shortlist : scores.slice(0, Math.min(5, scores.length));
    const chosen = pool[Math.floor(Math.random() * pool.length)] || scores[0];
    return { ...sample[chosen.i], aiPick: true, aiNovelty: Number(chosen.novelty.toFixed(3)) };
  } catch (err) {
    console.warn('AI question selection failed; using normal picker:', err);
    return sample[Math.floor(Math.random() * sample.length)] || candidates[0];
  }
}

export function getAIStatus() {
  return { ready: !!embedder, backend: activeBackend, model: activeModel || MODEL_CANDIDATES[0] };
}
