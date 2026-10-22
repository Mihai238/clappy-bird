import { rmsDb } from './logic/audio.ts';
import { createVoiceDetector } from './logic/detector.ts';

export type MicStatus = 'none' | 'ok' | 'denied' | 'missing' | 'insecure';

export class Microphone {
  status: MicStatus = 'none';
  level = -100;
  readonly claps = createVoiceDetector();
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private readonly buf = new Float32Array(1024);

  constructor(
    private readonly threshold: () => number,
    private readonly onClap: () => void,
  ) {}

  get live(): boolean {
    return this.analyser != null;
  }

  // Must be called straight from a user gesture so the audio context may start.
  async start(): Promise<MicStatus> {
    this.status = await this.open();
    return this.status;
  }

  stop(): void {
    this.stream?.getTracks().forEach(tr => tr.stop());
    this.stream = null;
    this.analyser = null;
    this.level = -100;
  }

  resume(): void {
    this.ctx?.resume().catch(() => {});
  }

  poll(): void {
    if (!this.analyser) return;
    this.analyser.getFloatTimeDomainData(this.buf);
    this.level = rmsDb(this.buf);
    if (this.claps.feed(this.level, this.threshold(), performance.now())) this.onClap();
  }

  private async open(): Promise<MicStatus> {
    if (this.stream) return 'ok';
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return 'insecure';
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new AC();
    this.resume();
    try {
      // Raw signal: echo cancellation and auto gain would flatten the spikes we look for.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      return (err as { name?: string } | null)?.name === 'NotFoundError' ? 'missing' : 'denied';
    }
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = this.buf.length;
    this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
    this.stream.getAudioTracks()[0]?.addEventListener('ended', () => this.stop());
    return 'ok';
  }
}
