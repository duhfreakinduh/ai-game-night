# Brain Bash AI

A fast, family-friendly learning party game for **2–10 players** that works on one phone, tablet, or computer.

## MVP features

- 2–10 local players
- Mixed-age adaptive difficulty (levels 1–5)
- Party Mix, Team Battle, and Learning Quest setup modes
- Math, words, science, world, history, and optional Bible categories
- Streak scoring, 50/50, double-points power-up, surprise rounds
- Per-player learning recap
- LocalStorage for setup preferences
- Installable PWA + offline core game
- Optional Hugging Face AI Game Master using `onnx-community/Qwen3-0.6B-ONNX` in the browser through Transformers.js/WebGPU
- AI failure never blocks the core game

## Privacy-first design

The MVP has no accounts, ads, analytics, chat, geolocation, camera, microphone, or cloud score storage. Player names and game progress stay on the device. The optional AI model runs in the browser when supported; it is not required for gameplay.

If this becomes a public child-directed service, review COPPA requirements before adding any feature that collects or shares personal information.

## Run locally

Because the app uses JavaScript modules, serve the folder instead of opening `index.html` directly:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Deploy

This is a static app. It can be hosted on GitHub Pages or mirrored to a Hugging Face Static Space.

## AI notes

The optional AI layer is intentionally a *remixer*, not the source of truth. Questions and answers originate from a curated local bank; AI can make wording more playful and age-appropriate while the game keeps working offline.

## Roadmap

1. True team score aggregation and pass-the-device team turns
2. More question packs and difficulty calibration
3. AI-generated hints/story wrappers with validation
4. Custom parent/teacher topic packs
5. Classroom mode / QR join without collecting child accounts
6. Hugging Face Static Space mirror
7. Accessibility pass and automated tests
