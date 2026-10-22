export interface Settings {
  micSens: number;
}

// The game's old name, kept so players don't lose their best score.
const PREFIX = 'tiltbird.';

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

export const settings: Settings = {
  micSens: num(load('micSens'), 6),
};

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  settings[key] = value;
  save(key, value);
}

export const loadBest = (): number => num(load('best'), 0);
export const saveBest = (best: number): void => save('best', best);
