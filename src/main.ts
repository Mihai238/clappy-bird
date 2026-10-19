import { Game, WIDTH, type Controls, type Mode } from './game.ts';
import { micThreshold } from './logic/audio.ts';
import { clamp } from './logic/math.ts';
import { flickThreshold } from './logic/motion.ts';
import { tiltAmount } from './logic/tilt.ts';
import { Microphone } from './mic.ts';
import { Renderer, type Hud } from './render.ts';
import { MotionSensors } from './sensors.ts';
import { loadBest, saveBest, setSetting, settings } from './settings.ts';

const byId = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const canvas = byId<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;
const menuEl = byId('menu');
const overEl = byId('over');
const statusEl = byId('status');
const helpEl = byId('mode-help');
const startEl = byId<HTMLButtonElement>('start');
const sensEl = byId<HTMLInputElement>('sens');
const invertEl = byId<HTMLInputElement>('invert');
const micSensEl = byId<HTMLInputElement>('micsens');

const keys = { up: false, down: false };
let best = loadBest();

const sensors = new MotionSensors(() => settings.mode === 'flick', () => flickThreshold(settings.sens), () => game.flap());
const mic = new Microphone(() => settings.mode === 'voice', () => micThreshold(settings.micSens), () => game.flap());

const controls: Controls = {
  get mode() { return settings.mode; },
  get beta() { return sensors.beta; },
  tilt: neutral => keys.up ? 1 : keys.down ? -1 : tiltAmount(sensors.beta, neutral, settings.invert),
};

const game = new Game(controls, {
  onDie(score) {
    navigator.vibrate?.(60);
    if (score > best) {
      best = score;
      saveBest(best);
    }
  },
  onOver(score) {
    byId('final-score').textContent = String(score);
    byId('best-score').textContent = String(best);
    overEl.hidden = false;
  },
});
const renderer = new Renderer(ctx);

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cw = window.innerWidth, ch = window.innerHeight;
  const height = clamp(Math.round(WIDTH * ch / cw), 480, 900);
  const scale = Math.min(cw / WIDTH, ch / height);
  canvas.style.width = WIDTH * scale + 'px';
  canvas.style.height = height * scale + 'px';
  canvas.width = Math.round(WIDTH * scale * dpr);
  canvas.height = Math.round(height * scale * dpr);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  game.resize(height);
}
window.addEventListener('resize', resize);
resize();

function noSensorText(): string {
  if (settings.mode === 'voice') {
    if (mic.status === 'insecure') return 'Microphone needs HTTPS. Tap to flap.';
    if (mic.status === 'denied') return 'Microphone access blocked. Tap to flap.';
    if (mic.status === 'missing') return 'No microphone found. Tap to flap.';
    return 'Microphone stopped. Tap to flap.';
  }
  if (sensors.status === 'insecure') return 'Sensors need HTTPS. Tap to flap.';
  if (sensors.status === 'denied') return 'Motion access blocked. Tap to flap.';
  return 'No motion sensor found. Tap to flap.';
}

function hud(): Hud {
  const mode = settings.mode;
  if (mode === 'tilt') {
    const live = sensors.orientSeen || keys.up || keys.down;
    const value = game.state === 'play' ? controls.tilt(game.neutral) : 0;
    return { mode, readyHint: '', meter: live ? { kind: 'tilt', value } : { kind: 'message', text: noSensorText() } };
  }
  const voice = mode === 'voice';
  const live = voice ? mic.live : sensors.motionSeen;
  // Flick: 0–30 m/s². Voice: −60–0 dBFS.
  const toBar = voice ? (db: number) => clamp((db + 60) / 60, 0, 1) : (a: number) => clamp(a / 30, 0, 1);
  const detector = voice ? mic.claps : sensors.flicks;
  return {
    mode,
    readyHint: !live ? 'Tap to flap' : voice ? 'Clap or shout to flap' : 'Flick the phone to flap',
    meter: !live ? { kind: 'message', text: noSensorText() } : {
      kind: 'level',
      label: voice ? 'Mic' : 'Motion',
      level: toBar(voice ? mic.level : sensors.signal),
      threshold: toBar(voice ? micThreshold(settings.micSens) : flickThreshold(settings.sens)),
      hot: performance.now() - detector.lastTrigger < 150,
    },
  };
}

let wakeLock: WakeLockSentinel | null = null;
async function keepAwake(): Promise<void> {
  if (wakeLock || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || game.state === 'menu') return;
  void keepAwake();
  mic.resume();
});

let last = performance.now();
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  mic.poll();
  game.update(dt);
  renderer.draw(game, hud());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- UI ----------
const HELP: Record<Mode, string> = {
  flick: 'Give the phone a quick jerk to flap, like a tap. Gravity pulls the bird down between flicks.',
  tilt: 'Tilt the top of the phone up to climb and down to dive. You set what counts as level during the countdown.',
  voice: 'Make a short, sharp sound to flap: a clap, a shouted "pah!" or a whistle. Each sound flaps once, so let it stop before the next.',
};

function syncMenu(): void {
  byId<HTMLInputElement>('mode-' + settings.mode).checked = true;
  helpEl.textContent = HELP[settings.mode];
  byId('row-sens').hidden = settings.mode !== 'flick';
  byId('row-invert').hidden = settings.mode !== 'tilt';
  byId('row-micsens').hidden = settings.mode !== 'voice';
  sensEl.value = String(settings.sens);
  invertEl.checked = settings.invert;
  micSensEl.value = String(settings.micSens);
}
syncMenu();

function newRun(): void {
  game.newRun();
  overEl.hidden = true;
  menuEl.hidden = true;
  void keepAwake();
}

document.querySelectorAll<HTMLInputElement>('input[name=mode]').forEach(r => r.addEventListener('change', () => {
  setSetting('mode', r.value as Mode);
  syncMenu();
}));
sensEl.addEventListener('input', () => setSetting('sens', +sensEl.value));
invertEl.addEventListener('change', () => setSetting('invert', invertEl.checked));
micSensEl.addEventListener('input', () => setSetting('micSens', +micSensEl.value));

startEl.addEventListener('click', async () => {
  // The permission prompt can sit unanswered; block repeat requests and say what we wait for.
  startEl.disabled = true;
  if (settings.mode === 'voice') {
    statusEl.textContent = 'Allow microphone access to play with your voice.';
    const status = await mic.start();
    statusEl.textContent =
      status === 'insecure' ? 'Open this page over https:// to use the microphone. Tap works meanwhile.' :
      status === 'denied' ? "Microphone access was blocked. Allow it in your browser's site settings, then tap Start." :
      status === 'missing' ? 'No microphone found. Tap works meanwhile.' : '';
  } else {
    mic.stop();
    const status = await sensors.request();
    statusEl.textContent =
      status === 'insecure' ? 'Open this page over https:// to use motion. Tap works meanwhile.' :
      status === 'denied' ? 'Motion access was blocked. Reload the page and choose Allow.' : '';
  }
  startEl.disabled = false;
  newRun();
});

byId('again').addEventListener('click', newRun);
byId('settings').addEventListener('click', () => {
  overEl.hidden = true;
  menuEl.hidden = false;
  game.toMenu();
  mic.stop();
  syncMenu();
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  game.flap();
});
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (!menuEl.hidden || !overEl.hidden) return;
    e.preventDefault();
    game.flap();
  }
  if (e.code === 'ArrowUp') { keys.up = true; e.preventDefault(); }
  if (e.code === 'ArrowDown') { keys.down = true; e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowUp') keys.up = false;
  if (e.code === 'ArrowDown') keys.down = false;
});
