let generator = null;
let loading = null;

export async function initAI(onProgress = () => {}) {
  if (generator) return true;
  if (loading) return loading;

  loading = (async () => {
    try {
      onProgress('Loading Hugging Face AI… first load can be large.');
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0');
      generator = await pipeline('text-generation', 'onnx-community/Qwen3-0.6B-ONNX', {
        device: 'webgpu',
        dtype: 'q4',
        progress_callback: (p) => p?.progress && onProgress(`AI download ${Math.round(p.progress)}%`)
      });
      onProgress('AI Game Master ready on this device.');
      return true;
    } catch (err) {
      console.warn('AI unavailable:', err);
      generator = null;
      onProgress('AI could not load here. Offline adaptive mode is still active.');
      return false;
    }
  })();

  return loading;
}

const normalize = (value) => String(value).trim().toLocaleLowerCase();

export async function remixQuestion(seed, player) {
  if (!generator) return null;

  const canonicalAnswer = String(seed.a[seed.x]);
  const prompt = `You are a family-safe learning game master. Rewrite this multiple-choice question for a ${player.label} player. Preserve the exact correct answer text: ${JSON.stringify(canonicalAnswer)}. Do not change the underlying fact. Make the wording playful, short, and age appropriate. Return ONLY JSON with keys q, answers, correctIndex, hint. Seed: ${JSON.stringify(seed)}`;

  try {
    const out = await generator(prompt, {
      max_new_tokens: 130,
      temperature: 0.65,
      do_sample: true,
      return_full_text: false
    });
    const text = out?.[0]?.generated_text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.answers) || parsed.answers.length !== 4) return null;
    if (!Number.isInteger(parsed.correctIndex) || parsed.correctIndex < 0 || parsed.correctIndex > 3) return null;
    if (normalize(parsed.answers[parsed.correctIndex]) !== normalize(canonicalAnswer)) return null;

    const q = String(parsed.q || '').trim();
    const answers = parsed.answers.map(v => String(v).trim());
    if (q.length < 4 || q.length > 240 || answers.some(a => !a || a.length > 100)) return null;

    return {
      c: seed.c,
      l: seed.l,
      q,
      a: answers,
      x: parsed.correctIndex,
      h: String(parsed.hint || seed.h).trim().slice(0, 180)
    };
  } catch (err) {
    console.warn('AI remix failed:', err);
    return null;
  }
}
