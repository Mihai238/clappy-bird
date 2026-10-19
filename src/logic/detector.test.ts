import { describe, expect, it } from 'vitest';
import { createFlickDetector, createVoiceDetector } from './detector.ts';

type Sample = [value: number, ms: number];
const triggers = (feed: (v: number, now: number) => boolean, samples: Sample[]) =>
  samples.filter(([v, ms]) => feed(v, ms)).map(([, ms]) => ms);

describe('flick detector', () => {
  const THR = 12;
  const run = (samples: Sample[]) => {
    const d = createFlickDetector();
    return triggers((v, now) => d.feed(v, THR, now), samples);
  };

  it('flaps once for a single spike', () => {
    expect(run([[2, 0], [15, 16], [2, 32]])).toEqual([16]);
  });

  it('ignores the stopping spike at the end of a flick', () => {
    expect(run([[15, 0], [3, 60], [14, 110], [2, 140], [14, 200]])).toEqual([0]);
  });

  it('flaps for two flicks that settle in between', () => {
    expect(run([[15, 0], [2, 150], [15, 400]])).toEqual([0, 400]);
  });

  it('flaps once while the phone keeps shaking above the threshold', () => {
    const shaking: Sample[] = Array.from({ length: 60 }, (_, i) => [15, i * 16]);
    expect(run(shaking)).toEqual([0]);
  });

  it('stays disarmed until the signal drops well below the threshold', () => {
    expect(run([[15, 0], [8, 200], [8, 600], [15, 1000]])).toEqual([0]);
  });
});

describe('voice detector', () => {
  const THR = -32;
  const run = (samples: Sample[]) => {
    const d = createVoiceDetector();
    return triggers((v, now) => d.feed(v, THR, now), samples);
  };

  it('flaps once for a held sound', () => {
    const aaah: Sample[] = Array.from({ length: 60 }, (_, i) => [-20, i * 16]);
    expect(run(aaah)).toEqual([0]);
  });

  it('flaps for each "pah" with quiet in between', () => {
    expect(run([[-20, 0], [-50, 100], [-20, 200], [-50, 300], [-20, 400]])).toEqual([0, 200, 400]);
  });

  it('needs the sound to drop 8 dB below the threshold before the next flap', () => {
    expect(run([[-20, 0], [-35, 200], [-20, 400]])).toEqual([0]);
  });

  it('enforces a short cooldown between flaps', () => {
    expect(run([[-20, 0], [-50, 50], [-20, 100], [-20, 200]])).toEqual([0, 200]);
  });

  it('records when it last triggered', () => {
    const d = createVoiceDetector();
    expect(d.lastTrigger).toBe(-Infinity);
    d.feed(-20, THR, 1234);
    expect(d.lastTrigger).toBe(1234);
  });
});
