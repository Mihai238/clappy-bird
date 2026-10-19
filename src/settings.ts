import type { Mode } from './game.ts';

export interface Settings {
  mode: Mode;
  sens: number;
  invert: boolean;
  micSens: number;
}

const PREFIX = 'tiltbird.';
const MODES: readonly Mode[] = ['flick', 'tilt', 'voice'];

// Storage can throw in private windows or with blocked site data; the game must still run.
function load(key: string): unknown {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v == null ? undefined : JSON.parse(v);
  } catch {
    return undefined;
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' ? v : fallback);
const savedMode = load('mode');

export const settings: Settings = {
  mode: MODES.includes(savedMode as Mode) ? (savedMode as Mode) : 'flick',
  sens: num(load('sens'), 6),
  invert: load('invert') === true,
  micSens: num(load('micSens'), 6),
};

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings[key] = value;
  save(key, value);
}

export const loadBest = (): number => num(load('best'), 0);
export const saveBest = (best: number): void => save('best', best);
