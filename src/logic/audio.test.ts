import { describe, expect, it } from 'vitest';
import { micThreshold, rmsDb } from './audio.ts';

describe('rmsDb', () => {
  it('reads silence as about -100 dBFS', () => {
    expect(rmsDb(new Float32Array(1024))).toBeCloseTo(-100, 0);
  });

  it('reads a constant half-scale signal as -6 dBFS', () => {
    expect(rmsDb(new Float32Array(1024).fill(0.5))).toBeCloseTo(-6.02, 1);
  });

  it('reads a full-scale sine as -3 dBFS', () => {
    const sine = Float32Array.from({ length: 1024 }, (_, i) => Math.sin((2 * Math.PI * 8 * i) / 1024));
    expect(rmsDb(sine)).toBeCloseTo(-3.01, 1);
  });
});

describe('mic threshold', () => {
  it('listens for quieter sounds at higher sensitivity', () => {
    expect(micThreshold(10)).toBeLessThan(micThreshold(1));
  });

  it('stays between silence and full scale across the slider range', () => {
    for (let s = 1; s <= 10; s++) {
      expect(micThreshold(s)).toBeLessThan(0);
      expect(micThreshold(s)).toBeGreaterThan(-60);
    }
  });
});
