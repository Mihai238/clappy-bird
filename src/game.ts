import { clamp } from './logic/math.ts';
import { FLAP_V, GAP, GRAVITY, MAX_FALL, PIPE_W, SPACING, SPEED, circleHitsRect, nextPipeTop } from './logic/physics.ts';

export type State = 'menu' | 'ready' | 'play' | 'dying' | 'over';

export interface Pipe {
  x: number;
  top: number;
  passed: boolean;
}

export interface GameEvents {
  onDie(score: number): void;
  onOver(score: number): void;
}

export const WIDTH = 360;
const DEATH_PAUSE = 0.7;

export class Game {
  height = 640;
  groundY = 550;
  readonly bird = { x: 92, y: 300, vy: 0, r: 13, rot: 0, wing: 0 };
  pipes: Pipe[] = [];
  score = 0;
  state: State = 'menu';
  flash = 0;
  t = 0;
  groundX = 0;
  cloudX = 0;
  private overTimer = 0;

  constructor(
    private readonly events: GameEvents,
    private readonly random: () => number = Math.random,
  ) {}

  resize(height: number): void {
    this.height = height;
    this.groundY = height - 90;
  }

  newRun(): void {
    this.bird.y = this.height * 0.42;
    this.bird.vy = 0;
    this.bird.rot = 0;
    this.pipes = [];
    this.score = 0;
    this.flash = 0;
    this.state = 'ready';
  }

  toMenu(): void {
    this.state = 'menu';
    this.pipes = [];
  }

  flap(): void {
    if (this.state === 'ready') this.startPlay();
    if (this.state !== 'play') return;
    this.bird.vy = FLAP_V;
    this.bird.wing = 1;
  }

  update(dt: number): void {
    const bird = this.bird;
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt * 3);
    bird.wing = Math.max(0, bird.wing - dt * 5);

    if (this.state === 'ready' || this.state === 'play' || this.state === 'menu') {
      this.groundX = (this.groundX + SPEED * dt) % 24;
      this.cloudX = (this.cloudX + SPEED * 0.15 * dt) % (WIDTH + 200);
    }

    if (this.state === 'menu' || this.state === 'ready') {
      bird.y = this.height * 0.42 + Math.sin(this.t * 5) * 6;
      bird.rot = 0;
      return;
    }

    if (this.state === 'play') {
      bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL);
      bird.rot = clamp(bird.vy / 600, -0.45, 1.3);
      bird.y += bird.vy * dt;
      if (bird.y < bird.r) {
        bird.y = bird.r;
        bird.vy = Math.max(0, bird.vy);
      }

      for (const p of this.pipes) p.x -= SPEED * dt;
      if (this.pipes.length && this.pipes[0]!.x < -PIPE_W) this.pipes.shift();
      const last = this.pipes[this.pipes.length - 1];
      if (last && last.x < WIDTH + 60 - SPACING) this.spawnPipe(last.x + SPACING);

      for (const p of this.pipes) {
        if (!p.passed && p.x + PIPE_W < bird.x) {
          p.passed = true;
          this.score++;
        }
        if (circleHitsRect(bird.x, bird.y, bird.r - 2, p.x, 0, PIPE_W, p.top) ||
            circleHitsRect(bird.x, bird.y, bird.r - 2, p.x, p.top + GAP, PIPE_W, this.groundY - p.top - GAP)) {
          this.die();
          break;
        }
      }
      if (bird.y + bird.r >= this.groundY) {
        bird.y = this.groundY - bird.r;
        this.die();
      }
      return;
    }

    if (this.state === 'dying') {
      if (bird.y + bird.r < this.groundY) {
        bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL);
        bird.y = Math.min(bird.y + bird.vy * dt, this.groundY - bird.r);
        bird.rot = Math.min(bird.rot + dt * 6, 1.5);
      }
      this.overTimer -= dt;
      if (this.overTimer <= 0) {
        this.state = 'over';
        this.events.onOver(this.score);
      }
    }
  }

  private startPlay(): void {
    this.state = 'play';
    this.spawnPipe(WIDTH + 60);
  }

  private spawnPipe(x: number): void {
    const prev = this.pipes[this.pipes.length - 1];
    this.pipes.push({ x, top: nextPipeTop(prev?.top, this.groundY, this.random), passed: false });
  }

  private die(): void {
    if (this.state !== 'play') return;
    this.state = 'dying';
    this.flash = 1;
    this.overTimer = DEATH_PAUSE;
    this.events.onDie(this.score);
  }
}
