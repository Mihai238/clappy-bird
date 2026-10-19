import { clamp } from './math.ts';

export const GRAVITY = 1500, FLAP_V = -430, MAX_FALL = 620;
export const SPEED = 140, GAP = 158, PIPE_W = 62, SPACING = 215;
export const TILT_V = 380;

const PIPE_MARGIN = 64;
const MAX_GAP_SHIFT = 170;

export function circleHitsRect(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number): boolean {
  const nx = clamp(cx, x, x + w), ny = clamp(cy, y, y + h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// Keeps each gap within reach of the previous one.
export function nextPipeTop(prevTop: number | undefined, groundY: number, random: () => number = Math.random): number {
  const span = groundY - GAP - PIPE_MARGIN * 2;
  const top = PIPE_MARGIN + random() * span;
  return prevTop === undefined ? top : clamp(top, prevTop - MAX_GAP_SHIFT, prevTop + MAX_GAP_SHIFT);
}
