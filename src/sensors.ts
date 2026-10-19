import { createFlickDetector } from './logic/detector.ts';
import { createLinearAcceleration } from './logic/motion.ts';

export type SensorStatus = 'none' | 'ok' | 'denied' | 'insecure';

interface PermissionGated {
  requestPermission?: () => Promise<string>;
}

export class MotionSensors {
  status: SensorStatus = 'none';
  motionSeen = false;
  orientSeen = false;
  signal = 0;
  beta: number | null = null;
  readonly flicks = createFlickDetector();
  private listening = false;
  private readonly linearAcceleration = createLinearAcceleration();

  constructor(
    private readonly flickEnabled: () => boolean,
    private readonly threshold: () => number,
    private readonly onFlick: () => void,
  ) {}

  // Must be called straight from a user gesture: iOS only shows the prompt then.
  async request(): Promise<SensorStatus> {
    this.status = await this.ask();
    return this.status;
  }

  private async ask(): Promise<SensorStatus> {
    if (!window.isSecureContext) return 'insecure';
    const apis = [globalThis.DeviceMotionEvent, globalThis.DeviceOrientationEvent] as unknown as (PermissionGated | undefined)[];
    const asks = apis.flatMap(api => typeof api?.requestPermission === 'function' ? [api.requestPermission()] : []);
    try {
      const results = await Promise.all(asks);
      if (results.some(r => r !== 'granted')) return 'denied';
    } catch {
      return 'denied';
    }
    if (!this.listening) {
      window.addEventListener('devicemotion', this.onMotion);
      window.addEventListener('deviceorientation', this.onOrient);
      this.listening = true;
    }
    return 'ok';
  }

  private readonly onMotion = (e: DeviceMotionEvent): void => {
    const mag = this.linearAcceleration(e);
    if (mag == null) return;
    this.motionSeen = true;
    this.signal = mag;
    if (this.flickEnabled() && this.flicks.feed(mag, this.threshold(), performance.now())) this.onFlick();
  };

  private readonly onOrient = (e: DeviceOrientationEvent): void => {
    if (e.beta == null) return;
    this.orientSeen = true;
    this.beta = e.beta;
  };
}
