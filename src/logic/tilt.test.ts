import { describe, expect, it } from 'vitest';
import { neutralFrom, tiltAmount } from './tilt.ts';

describe('tiltAmount', () => {
  it('is zero until the level angle is known', () => {
    expect(tiltAmount(50, null, false)).toBe(0);
    expect(tiltAmount(null, 40, false)).toBe(0);
  });

  it('ignores small wobbles around level', () => {
    expect(tiltAmount(42.9, 40, false)).toBe(0);
    expect(tiltAmount(37.1, 40, false)).toBe(0);
  });

  it('climbs when the top of the phone tilts up and dives when it tilts down', () => {
    expect(tiltAmount(54, 40, false)).toBeCloseTo(0.5);
    expect(tiltAmount(26, 40, false)).toBeCloseTo(-0.5);
  });

  it('starts from zero at the edge of the dead zone', () => {
    expect(tiltAmount(43.01, 40, false)).toBeCloseTo(0, 2);
  });

  it('caps at full climb and full dive', () => {
    expect(tiltAmount(90, 40, false)).toBe(1);
    expect(tiltAmount(-10, 40, false)).toBe(-1);
  });

  it('flips direction when inverted', () => {
    expect(tiltAmount(54, 40, true)).toBeCloseTo(-0.5);
  });
});

describe('neutralFrom', () => {
  it('has no level without samples', () => {
    expect(neutralFrom([])).toBeNull();
  });

  it('averages only the most recent 30 samples', () => {
    const samples = [...Array(20).fill(0), ...Array(30).fill(40)];
    expect(neutralFrom(samples)).toBe(40);
  });
});
