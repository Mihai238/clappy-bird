interface Vec3 {
  x: number | null;
  y: number | null;
  z: number | null;
}

export interface MotionSample {
  acceleration?: Vec3 | null;
  accelerationIncludingGravity?: Vec3 | null;
}

// Linear acceleration (m/s², gravity removed) that counts as a flick.
export const flickThreshold = (sens: number): number => 22 - sens * 1.6;

const complete = (v: Vec3 | null | undefined): v is { x: number; y: number; z: number } =>
  v != null && v.x != null && v.y != null && v.z != null;

export function createLinearAcceleration(): (e: MotionSample) => number | null {
  let gravity = 9.81;
  return e => {
    if (complete(e.acceleration)) return Math.hypot(e.acceleration.x, e.acceleration.y, e.acceleration.z);
    // No gravity-free reading: high-pass the total magnitude instead.
    const g = e.accelerationIncludingGravity;
    if (!complete(g)) return null;
    const m = Math.hypot(g.x, g.y, g.z);
    gravity += (m - gravity) * 0.08;
    return Math.abs(m - gravity);
  };
}
