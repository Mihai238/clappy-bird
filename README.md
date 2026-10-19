# Tilt Bird

Flappy Bird played by moving your phone instead of tapping.

**Play:** https://mihai238.github.io/flappy-bird/ (open it on your phone)

## Controls

- **Flick:** jerk the phone to flap. Use the sensitivity slider if one flick gives two flaps, or none.
- **Tilt:** tilt the top of the phone up to climb and down to dive. The countdown takes your current angle as level.
- **Voice:** clap, shout "pah!" or whistle to flap. Each sound flaps once. Use the mic sensitivity slider if background noise sets it off.

Lock screen rotation in portrait. Tap or Space also flaps, and the arrow keys steer in Tilt mode, so it works on a computer too.

## Development

TypeScript + Vite, tested with Vitest. Needs Node 24.

```sh
npm install
npm run dev     # http://localhost:5173 on this computer
npm run phone   # https on your Wi-Fi, for a phone
npm test
npm run build   # production build in dist/
```

Phones only expose motion sensors and the microphone to `https` pages, so `npm run phone` serves with a self-signed certificate. Open the `Network` address it prints on your phone and accept the certificate warning once.

Every push to `main` runs the tests, builds and deploys to GitHub Pages.
