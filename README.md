# Clappy Bird

Flappy Bird played with your voice instead of tapping.

**Play:** https://mihai238.github.io/flappy-bird/ (open it on your phone)

## Controls

Clap, shout "pah!" or whistle to flap. Each sound flaps once. Use the mic sensitivity slider if background noise sets it off.

Lock screen rotation in portrait. Tap or Space also flaps, so it works without a microphone too.

## Development

TypeScript + Vite, tested with Vitest. Needs Node 24.

```sh
npm install
npm run dev     # http://localhost:5173 on this computer
npm run phone   # https on your Wi-Fi, for a phone
npm test
npm run build   # production build in dist/
```

Phones only expose the microphone to `https` pages, so `npm run phone` serves with a self-signed certificate. Open the `Network` address it prints on your phone and accept the certificate warning once.

Every push to `main` runs the tests, builds and deploys to GitHub Pages.
