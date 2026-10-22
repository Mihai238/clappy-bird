// Loudness (dBFS) that counts as a flap.
export const micThreshold = (sens: number): number => -8 - sens * 4;

export function rmsDb(samples: Float32Array | number[]): number {
  let sum = 0;
  for (const v of samples) sum += v * v;
  return 10 * Math.log10(sum / samples.length + 1e-10);
}
