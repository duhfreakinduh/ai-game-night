# AI / Contributor Guide

This is a browser-first game app with optional Hugging Face-powered AI selection. Keep gameplay usable even when AI is still loading or unavailable.

## Priorities
1. Never block Start on model download or inference.
2. Prevent repeated or near-duplicate questions with deterministic history checks first; AI novelty scoring is an enhancement, not the only defense.
3. Keep AI local/browser-side when practical. Do not add exposed provider tokens to client code.
4. Add short timeouts and a normal random/non-repeating fallback for every AI call.
5. Cache model assets responsibly and keep mobile memory/CPU use conservative.
6. Preserve accessibility, touch usability, PWA/offline behavior, and fast first load.
7. Never commit secrets or personal data.
8. Update README/AI_ENGINE.md whenever model choice, fallback behavior, or setup changes.

## Before merging
- Start a game before AI finishes loading.
- Play enough rounds to verify recent questions do not repeat.
- Test with network/model loading disabled.
- Check browser console for uncaught errors.
- Verify service-worker caching still updates correctly.
