import { clamp } from './math.ts';

const DEAD_ZONE = 3;
const FULL_TILT = 22;

// -1..1, positive means climb.
export function tiltAmount(beta: number | null, neutral: number | null, invert: boolean): number {
  if (beta == null || neutral == null) return 0;
  let d = beta - neutral;
  if (invert) d = -d;
  if (Math.abs(d) < DEAD_ZONE) return 0;
  return clamp((d - Math.sign(d) * DEAD_ZONE) / FULL_TILT, -1, 1);
}

export function neutralFrom(betaSamples: number[]): number | null {
  const recent = betaSamples.slice(-30);
  return recent.length ? recent.reduce((s, b) => s + b, 0) / recent.length : null;
}
