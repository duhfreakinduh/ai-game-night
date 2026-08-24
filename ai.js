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

export async function remixQuestion(seed, player) {
  if (!generator) return null;

  const prompt = `You are a family-safe game master. Rewrite this multiple-choice learning question for a ${player.label} player. Keep the exact same correct answer and facts. Make it playful, short, and age appropriate. Return ONLY JSON with keys q, answers, correctIndex, hint. Seed: ${JSON.stringify(seed)}`;

  try {
    const out = await generator(prompt, {
      max_new_tokens: 130,
      temperature: 0.7,
      do_sample: true,
      return_full_text: false
    });
    const text = out?.[0]?.generated_text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed.answers) || parsed.answers.length !== 4 || !Number.isInteger(parsed.correctIndex)) return null;

    return {
      c: seed.c,
      l: seed.l,
      q: String(parsed.q),
      a: parsed.answers.map(String),
      x: parsed.correctIndex,
      h: String(parsed.hint || seed.h)
    };
  } catch (err) {
    console.warn('AI remix failed:', err);
    return null;
  }
}
