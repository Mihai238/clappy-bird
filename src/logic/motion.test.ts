import { describe, expect, it } from 'vitest';
import { createLinearAcceleration, flickThreshold } from './motion.ts';

describe('linear acceleration', () => {
  it('uses the gravity-free reading when the phone provides one', () => {
    const accel = createLinearAcceleration();
    expect(accel({ acceleration: { x: 3, y: 4, z: 0 } })).toBe(5);
  });

  it('reads near zero for a phone at rest when only gravity is reported', () => {
    const accel = createLinearAcceleration();
    const atRest = { acceleration: null, accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 } };
    for (let i = 0; i < 50; i++) accel(atRest);
    expect(accel(atRest)).toBeCloseTo(0, 3);
  });

  it('picks out a jolt on top of gravity', () => {
    const accel = createLinearAcceleration();
    const atRest = { accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 } };
    for (let i = 0; i < 50; i++) accel(atRest);
    expect(accel({ accelerationIncludingGravity: { x: 0, y: 25, z: 0 } })).toBeGreaterThan(12);
  });

  it('falls back when the gravity-free reading has missing axes', () => {
    const accel = createLinearAcceleration();
    const sample = { acceleration: { x: null, y: null, z: null }, accelerationIncludingGravity: { x: 0, y: 9.81, z: 0 } };
    expect(accel(sample)).toBeCloseTo(0, 5);
  });

  it('returns null when the event has no readings', () => {
    expect(createLinearAcceleration()({})).toBeNull();
  });
});

describe('flick threshold', () => {
  it('needs a harder flick at low sensitivity', () => {
    expect(flickThreshold(1)).toBeGreaterThan(flickThreshold(10));
  });

  it('stays positive across the slider range', () => {
    for (let s = 1; s <= 10; s++) expect(flickThreshold(s)).toBeGreaterThan(0);
  });
});
