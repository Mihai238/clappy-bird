import { describe, expect, it } from 'vitest';
import { GAP, circleHitsRect, nextPipeTop } from './physics.ts';

describe('circleHitsRect', () => {
  it('hits when the centre is inside', () => {
    expect(circleHitsRect(10, 10, 5, 0, 0, 20, 20)).toBe(true);
  });

  it('misses when the circle only touches the edge', () => {
    expect(circleHitsRect(25, 10, 5, 0, 0, 20, 20)).toBe(false);
  });

  it('uses the real distance near a corner', () => {
    expect(circleHitsRect(-8, -8, 10, 0, 0, 20, 20)).toBe(false);
    expect(circleHitsRect(-8, -8, 12, 0, 0, 20, 20)).toBe(true);
  });
});

describe('nextPipeTop', () => {
  const groundY = 550;
  const lowest = groundY - GAP - 64;

  it('keeps the first gap clear of the ceiling and the ground', () => {
    expect(nextPipeTop(undefined, groundY, () => 0)).toBe(64);
    expect(nextPipeTop(undefined, groundY, () => 0.9999)).toBeLessThanOrEqual(lowest);
  });

  it('keeps each gap within reach of the previous one', () => {
    expect(nextPipeTop(64, groundY, () => 0.9999)).toBe(64 + 170);
    expect(nextPipeTop(lowest, groundY, () => 0)).toBe(lowest - 170);
  });

  it('stays in bounds over a long run', () => {
    let seed = 1;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let top: number | undefined;
    for (let i = 0; i < 500; i++) {
      const next = nextPipeTop(top, groundY, random);
      expect(next).toBeGreaterThanOrEqual(64);
      expect(next).toBeLessThanOrEqual(lowest);
      if (top !== undefined) expect(Math.abs(next - top)).toBeLessThanOrEqual(170 + 1e-9);
      top = next;
    }
  });
});
