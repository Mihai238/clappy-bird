import { describe, expect, it } from 'vitest';
import { createVoiceDetector } from './detector.ts';

type Sample = [value: number, ms: number];
const triggers = (feed: (v: number, now: number) => boolean, samples: Sample[]) =>
  samples.filter(([v, ms]) => feed(v, ms)).map(([, ms]) => ms);

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
