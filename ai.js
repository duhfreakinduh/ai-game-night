const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let embedder = null;
let loading = null;
let activeBackend = null;

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

export async function initAI(onProgress = () => {}) {
  if (embedder) {
    onProgress('AI Game Master ready — semantic variety is ON.');
    return true;
  }
  if (loading) return loading;

  loading = (async () => {
    try {
      onProgress('Starting lightweight Hugging Face AI…');
      const { pipeline, env } = await import(TRANSFORMERS_URL);
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      onProgress('Loading phone-friendly AI model…');
      embedder = await pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
        progress_callback: progressReporter(onProgress),
      });
      activeBackend = 'phone CPU';

      onProgress('Testing AI…');
      await selfTest();
      onProgress('AI Game Master ready — semantic variety is ON.');
      return true;
    } catch (err) {
      console.error('Brain Bash AI failed:', err);
      try { await embedder?.dispose?.(); } catch {}
      embedder = null;
      activeBackend = null;
      const detail = String(err?.message || err || 'unknown error').slice(0, 140);
      onProgress(`AI load failed: ${detail}`);
      return false;
    } finally {
      loading = null;
    }
  })();

  return loading;
}

export async function chooseWithAI(candidates, recentTexts = []) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  if (!embedder || candidates.length < 2) {
    return candidates[Math.floor(Math.random() * candidates.length)] || candidates[0];
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, 10);
  const recent = recentTexts.filter(Boolean).slice(-5);
  if (!recent.length) {
    return { ...shuffled[Math.floor(Math.random() * shuffled.length)], aiPick: true };
  }

  try {
    const vectors = await embedTexts([...shuffled.map(q => q.q), ...recent]);
    const candidateVectors = vectors.slice(0, shuffled.length);
    const recentVectors = vectors.slice(shuffled.length);

    let bestIndex = 0;
    let bestScore = Infinity;
    for (let i = 0; i < candidateVectors.length; i++) {
      let maxSimilarity = -1;
      for (const oldVector of recentVectors) {
        maxSimilarity = Math.max(maxSimilarity, dot(candidateVectors[i], oldVector));
      }
      if (maxSimilarity < bestScore) {
        bestScore = maxSimilarity;
        bestIndex = i;
      }
    }

    return { ...shuffled[bestIndex], aiPick: true };
  } catch (err) {
    console.warn('AI question selection failed; using normal picker:', err);
    return shuffled[Math.floor(Math.random() * shuffled.length)] || candidates[0];
  }
}

export function getAIStatus() {
  return { ready: !!embedder, backend: activeBackend, model: MODEL_ID };
}
