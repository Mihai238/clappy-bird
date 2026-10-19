# Tilt Bird

Flappy Bird controlled by the phone: a flick flaps, tilt steers, or a sound flaps. TypeScript + Vite, no runtime dependencies, a canvas game.

- `src/logic/`: pure functions (spike detectors, motion and loudness maths, tilt, physics). No DOM, all unit-tested.
- `src/game.ts`: the game state machine. It reads input through the `Controls` interface, so it runs in tests without a browser.
- `src/sensors.ts`, `src/mic.ts`: device motion and microphone input. `src/render.ts`: canvas drawing. `src/main.ts`: wiring, menu and the frame loop.
- `index.html` holds the menu markup; `src/style.css` the styles.

## Running locally

- On a phone: `npm run phone`, then open the printed `Network` address. It serves over HTTPS with a self-signed certificate, because phones only expose motion sensors and the microphone to `https` pages.
- In a desktop browser (for browser testing), see the `browser-test` skill. Tap/Space flaps and the arrow keys steer in Tilt mode, so everything but the sensors can be checked there.
- Never commit `.cert/`, `node_modules/` or `dist/`.

## Deploying

Every push to `main` runs `.github/workflows/deploy.yml`: tests, build, then deploy to GitHub Pages. A failing test blocks the deploy. Asset paths are relative (`base: './'` in `vite.config.ts`) because Pages serves the game under `/flappy-bird/`.

## Coding style

- Do not add a comment on every function. Code should be self-explanatory through naming and structure, so comments restating *what* the code does are noise. Only comment *why* something is done when the reason is non-obvious — a browser quirk, a sensor workaround, a tuning trade-off, or a subtle constraint.

  ```js
  // Avoid
  // Draws the bird.
  function drawBird() { ... }

  // Good
  // iOS only fires devicemotion after a permission prompt that must come from a user gesture
  document.getElementById('start').addEventListener('click', async () => { ... });
  ```

- Write code that reads like the surrounding code: match its naming, idiom and comment density.

## Describing behavior

- Before describing how the game behaves (what a screen shows, what a control does, in which order), read the code in `src/` and `index.html`. Don't infer it from what the game is likely to do.
- Keep the README's Controls section in sync when controls or modes change.

## Testing

- `npm test` runs the Vitest suite (`src/**/*.test.ts`) and `npm run typecheck` the type check. Run both before committing. Put new game logic in `src/logic/` or `Game` so it can be tested, and add tests with it.
- Unit tests don't prove the screen. Also verify a change in a real browser with the `browser-test` skill, and report it as working only because the browser showed it, never because the code looks right.
- Motion controls can't be verified on a desktop. Say so, and ask the user to check them on a phone.

## Working with agents

- Keep the main session for planning, reviewing and deciding. Delegate to subagents whatever pulls a lot of content into the context, browser testing above all.
- Agents can die on API overload errors (529). Tell them to save edits incrementally, and resume them rather than taking the work over.
- Before implementing a feature, show the plan as an HTML artifact and wait for the user's approval. Fixes from a review or the user's feedback go ahead without a new plan.
- Never write auto-memory: it is hidden and stays on one machine. Durable rules go into this file, a skill or `.claude/rules/`, where they're versioned with the project.

## Commits

- Keep the message to a single line saying what changed. No description body, no bullet lists, and no tool attribution trailers such as `Co-Authored-By`.
- Prefix with the area when there is an obvious one (`game:`, `serve:`, `docs:`, `misc:`): `game: widen the pipe gap in Tilt mode`.
