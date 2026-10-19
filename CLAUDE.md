# Tilt Bird

Flappy Bird controlled by phone motion: a flick flaps, or tilt steers. The whole game is `index.html` (canvas, inline CSS and JS, no build step, no dependencies). `serve.py` serves it over HTTPS on the LAN, because phones only expose motion sensors to `https` pages.

## Running locally

- On a phone: `python3 serve.py`, then open the printed `https://` address. It creates a self-signed certificate in `.cert/` on first run.
- In a desktop browser (for browser testing), see the `browser-test` skill. Tap/Space flaps and the arrow keys steer in Tilt mode, so everything but the sensors can be checked there.
- `serve.py` serves only `index.html` so the certificate key in `.cert/` never leaves the machine. Keep it that way when changing the server, and never commit `.cert/`.

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

- Before describing how the game behaves (what a screen shows, what a control does, in which order), read the code in `index.html`. Don't infer it from what the game is likely to do.
- Keep the README's Controls section in sync when controls or modes change.

## Testing

- There is no automated test suite. Verify a change in a real browser with the `browser-test` skill, and report it as working only because the browser showed it, never because the code looks right.
- Motion controls can't be verified on a desktop. Say so, and ask the user to check them on a phone.

## Working with agents

- Keep the main session for planning, reviewing and deciding. Delegate to subagents whatever pulls a lot of content into the context, browser testing above all.
- Agents can die on API overload errors (529). Tell them to save edits incrementally, and resume them rather than taking the work over.
- Before implementing a feature, show the plan as an HTML artifact and wait for the user's approval. Fixes from a review or the user's feedback go ahead without a new plan.
- Never write auto-memory: it is hidden and stays on one machine. Durable rules go into this file, a skill or `.claude/rules/`, where they're versioned with the project.

## Commits

- Keep the message to a single line saying what changed. No description body, no bullet lists, and no tool attribution trailers such as `Co-Authored-By`.
- Prefix with the area when there is an obvious one (`game:`, `serve:`, `docs:`, `misc:`): `game: widen the pipe gap in Tilt mode`.
