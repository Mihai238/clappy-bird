import { Game, WIDTH } from './game.ts';
import { micThreshold } from './logic/audio.ts';
import { clamp } from './logic/math.ts';
import { Microphone } from './mic.ts';
import { Renderer, type Hud } from './render.ts';
import { loadBest, saveBest, setSetting, settings } from './settings.ts';

const byId = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

const canvas = byId<HTMLCanvasElement>('game');
const ctx = canvas.getContext('2d')!;
const menuEl = byId('menu');
const overEl = byId('over');
const statusEl = byId('status');
const startEl = byId<HTMLButtonElement>('start');
const micSensEl = byId<HTMLInputElement>('micsens');

let best = loadBest();

const mic = new Microphone(() => micThreshold(settings.micSens), () => game.flap());

const game = new Game({
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

function noMicText(): string {
  if (mic.status === 'insecure') return 'Microphone needs HTTPS. Tap to flap.';
  if (mic.status === 'denied') return 'Microphone access blocked. Tap to flap.';
  if (mic.status === 'missing') return 'No microphone found. Tap to flap.';
  return 'Microphone stopped. Tap to flap.';
}

// The bar spans −60–0 dBFS.
const toBar = (db: number): number => clamp((db + 60) / 60, 0, 1);

function hud(): Hud {
  if (!mic.live) return { readyHint: 'Tap to flap', meter: { kind: 'message', text: noMicText() } };
  return {
    readyHint: 'Clap or shout to flap',
    meter: {
      kind: 'level',
      label: 'Mic',
      level: toBar(mic.level),
      threshold: toBar(micThreshold(settings.micSens)),
      hot: performance.now() - mic.claps.lastTrigger < 150,
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
micSensEl.value = String(settings.micSens);

function newRun(): void {
  game.newRun();
  overEl.hidden = true;
  menuEl.hidden = true;
  void keepAwake();
}

micSensEl.addEventListener('input', () => setSetting('micSens', +micSensEl.value));

startEl.addEventListener('click', async () => {
  // The permission prompt can sit unanswered; block repeat requests and say what we wait for.
  startEl.disabled = true;
  statusEl.textContent = 'Allow microphone access to play with your voice.';
  const status = await mic.start();
  statusEl.textContent =
    status === 'insecure' ? 'Open this page over https:// to use the microphone. Tap works meanwhile.' :
    status === 'denied' ? "Microphone access was blocked. Allow it in your browser's site settings, then tap Start." :
    status === 'missing' ? 'No microphone found. Tap works meanwhile.' : '';
  startEl.disabled = false;
  newRun();
});

byId('again').addEventListener('click', newRun);
byId('settings').addEventListener('click', () => {
  overEl.hidden = true;
  menuEl.hidden = false;
  game.toMenu();
  mic.stop();
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  game.flap();
});
window.addEventListener('keydown', e => {
  if (e.code !== 'Space' || !menuEl.hidden || !overEl.hidden) return;
  e.preventDefault();
  game.flap();
});
