---
name: browser-test
description: Play and check Tilt Bird in a real desktop browser through the Chrome DevTools MCP tools - start a local server, drive the menu and gameplay with the keyboard, and check the console. Use when asked to run the game, verify a change works, reproduce a bug, or check for console errors.
---

# Browser test

Drive the game with the Chrome DevTools MCP tools. This proves the screen and the game loop. It can't prove the motion controls (see the end).

## Main session or agent

Every chrome-devtools action returns a full page snapshot, so testing in the main session fills the context fast. Delegate browser testing to an agent: give it the scenario and the expected results, and have it report back a compact pass/fail. When testing in the main session is unavoidable, use `evaluate_script` that returns small JSON, and screenshots only when the canvas has to be seen.

## Server

The game is TypeScript, so it needs Vite to serve it; a plain static server can't. `npm run phone` uses a self-signed certificate, which the browser rejects, so for desktop testing use the plain-HTTP dev server bound to localhost:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5173/ --max-time 3
```

`000` means nothing is running: start `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` from the repo root with `run_in_background` (run `npm install` first if `node_modules/` is missing). If something already answers, it belongs to the user or another session: reuse it, never kill or restart it. Stop only a server you started.

Open `http://127.0.0.1:5173/`. Before reusing an open tab, check its URL in `list_pages`.

To check the production build instead (what GitHub Pages serves), run `npm run build`, then `npx vite preview --host 127.0.0.1 --port 4173 --strictPort` and open `http://127.0.0.1:4173/`.

## Driving the game

- The menu is HTML (mode radios `input[name=mode]`, sensitivity sliders, invert checkbox, `#start`). Act on `take_snapshot` uids.
- Voice mode asks for the microphone, and an unanswered prompt leaves Start disabled. To test past it, fake `navigator.mediaDevices.getUserMedia` with `evaluate_script` (resolve with an oscillator's `MediaStream` to grant, reject with a `NotAllowedError` to deny) before clicking Start.
- Gameplay is a `<canvas>`, so there is nothing to snapshot. Use `press_key` (Space to flap, ArrowUp/ArrowDown to steer in Tilt mode) and `take_screenshot` to see the result.
- Settings persist in `localStorage` under `tiltbird.*`. A "wrong" default is often a leftover setting, so clear those keys and reload before concluding.
- Wait on conditions (`wait_for` on expected text, or `evaluate_script` polling), never fixed sleeps.

## Verify

Every flow: the expected screen renders, `list_console_messages` is clean, and no request fails in `list_network_requests`. Report anything new in the console, even if it looks unrelated.

Report a change as working only because the browser showed it, never because the code looks right.

## Motion controls and the microphone

A desktop browser fires no `devicemotion`/`deviceorientation` events, so flick and tilt can't be verified here, and a faked microphone proves the wiring but not how real sounds trigger. Say so in the report, and ask the user to try it on a phone with `npm run phone`.
