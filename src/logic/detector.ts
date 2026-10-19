export interface SpikeDetector {
  readonly lastTrigger: number;
  feed(value: number, threshold: number, now: number): boolean;
}

interface SpikeDetectorOptions {
  rearmLevel: (threshold: number) => number;
  rearmAfterMs: number;
  cooldownMs: number;
}

export function createSpikeDetector({ rearmLevel, rearmAfterMs, cooldownMs }: SpikeDetectorOptions): SpikeDetector {
  let armed = true;
  let lastTrigger = -Infinity;
  return {
    get lastTrigger() { return lastTrigger; },
    feed(value, threshold, now) {
      if (!armed && value < rearmLevel(threshold) && now - lastTrigger > rearmAfterMs) armed = true;
      if (armed && value > threshold && now - lastTrigger > cooldownMs) {
        armed = false;
        lastTrigger = now;
        return true;
      }
      return false;
    },
  };
}

// One flick = one flap. The stop at the end of a flick makes a second spike,
// so wait for the signal to settle and enforce a short cooldown.
export const createFlickDetector = () =>
  createSpikeDetector({ rearmLevel: thr => thr * 0.45, rearmAfterMs: 120, cooldownMs: 300 });

// One sound = one flap: a held "aaah" has to die down before the next flap.
export const createVoiceDetector = () =>
  createSpikeDetector({ rearmLevel: thr => thr - 8, rearmAfterMs: 0, cooldownMs: 150 });
