---
name: browser-test
description: Play and check Tilt Bird in a real desktop browser through the Chrome DevTools MCP tools - start a local server, drive the menu and gameplay with the keyboard, and check the console. Use when asked to run the game, verify a change works, reproduce a bug, or check for console errors.
---

# Browser test

Drive the game with the Chrome DevTools MCP tools. This proves the screen and the game loop. It can't prove the motion controls (see the end).

## Main session or agent

Every chrome-devtools action returns a full page snapshot, so testing in the main session fills the context fast. Delegate browser testing to an agent: give it the scenario and the expected results, and have it report back a compact pass/fail. When testing in the main session is unavoidable, use `evaluate_script` that returns small JSON, and screenshots only when the canvas has to be seen.

## Server

`serve.py` uses a self-signed certificate, which the browser rejects. For desktop testing serve over plain HTTP, bound to localhost so `.cert/` isn't exposed to the LAN:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/ --max-time 3
```

`000` means nothing is running: start `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root with `run_in_background`. If something already answers, it belongs to the user or another session: reuse it, never kill or restart it. Stop only a server you started.

Open `http://127.0.0.1:8000/index.html`. Before reusing an open tab, check its URL in `list_pages`.

## Driving the game

- The menu is HTML (mode radios `input[name=mode]`, sensitivity slider, invert checkbox, `#start`). Act on `take_snapshot` uids.
- Gameplay is a `<canvas>`, so there is nothing to snapshot. Use `press_key` (Space to flap, ArrowUp/ArrowDown to steer in Tilt mode) and `take_screenshot` to see the result.
- Settings persist in `localStorage` under `tiltbird.*`. A "wrong" default is often a leftover setting, so clear those keys and reload before concluding.
- Wait on conditions (`wait_for` on expected text, or `evaluate_script` polling), never fixed sleeps.

## Verify

Every flow: the expected screen renders, `list_console_messages` is clean, and no request fails in `list_network_requests`. Report anything new in the console, even if it looks unrelated.

Report a change as working only because the browser showed it, never because the code looks right.

## Motion controls

A desktop browser fires no `devicemotion`/`deviceorientation` events, so flick and tilt can't be verified here. Say so in the report, and ask the user to try it on a phone with `python3 serve.py`.
