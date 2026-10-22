import { WIDTH, type Game, type Pipe } from './game.ts';
import { GAP, PIPE_W } from './logic/physics.ts';

export type Meter =
  | { kind: 'level'; label: string; level: number; threshold: number; hot: boolean }
  | { kind: 'message'; text: string };

export interface Hud {
  readyHint: string;
  meter: Meter;
}

const INK = '#2b1d0e';
const FONT = 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif';

export class Renderer {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  draw(game: Game, hud: Hud): void {
    const { ctx } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, game.groundY);
    sky.addColorStop(0, '#4ec0ca');
    sky.addColorStop(1, '#a6e3e9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, game.height);

    this.drawClouds(game.cloudX);
    this.drawSkyline(game.groundY);
    for (const p of game.pipes) this.drawPipe(p, game.groundY);
    this.drawGround(game);
    this.drawBird(game);

    if (game.state === 'play' || game.state === 'ready' || game.state === 'dying') this.outlinedText(String(game.score), WIDTH / 2, 70, 52);
    if (game.state === 'ready') this.drawReady(game.height, hud.readyHint);
    if (game.state !== 'menu') this.drawMeter(game.groundY, hud.meter);

    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${game.flash * 0.8})`;
      ctx.fillRect(0, 0, WIDTH, game.height);
    }
  }

  private drawClouds(cloudX: number): void {
    const { ctx } = this;
    const loop = WIDTH + 200;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const puffs = [[40, 90, 1], [230, 150, 0.8], [140, 230, 0.65], [320, 60, 0.9]] as const;
    for (const [x0, y, s] of puffs) {
      const x = ((x0 - cloudX * s) % loop + loop) % loop - 100;
      ctx.beginPath();
      ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
      ctx.arc(x + 20 * s, y - 8 * s, 22 * s, 0, Math.PI * 2);
      ctx.arc(x + 42 * s, y, 16 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawSkyline(base: number): void {
    const { ctx } = this;
    ctx.fillStyle = '#8fd3a0';
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= WIDTH; x += 30) {
      const h = 30 + ((x * 37) % 50);
      ctx.lineTo(x, base - h);
      ctx.lineTo(x + 30, base - h);
    }
    ctx.lineTo(WIDTH, base);
    ctx.fill();
  }

  private drawPipe(p: Pipe, groundY: number): void {
    const { ctx } = this;
    const lip = 22, over = 5;
    const body = '#74bf2e', dark = '#4f8a1c', light = '#a3e05a';
    const parts = [
      { y: 0, h: p.top, lipY: p.top - lip },
      { y: p.top + GAP, h: groundY - p.top - GAP, lipY: p.top + GAP },
    ];
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;
    for (const s of parts) {
      ctx.fillStyle = body;
      ctx.fillRect(p.x, s.y, PIPE_W, s.h);
      ctx.fillStyle = light;
      ctx.fillRect(p.x + 6, s.y, 8, s.h);
      ctx.fillStyle = dark;
      ctx.fillRect(p.x + PIPE_W - 12, s.y, 8, s.h);
      ctx.strokeRect(p.x, s.y, PIPE_W, s.h);

      ctx.fillStyle = body;
      ctx.fillRect(p.x - over, s.lipY, PIPE_W + over * 2, lip);
      ctx.fillStyle = light;
      ctx.fillRect(p.x - over + 6, s.lipY, 8, lip);
      ctx.strokeRect(p.x - over, s.lipY, PIPE_W + over * 2, lip);
    }
  }

  private drawGround(game: Game): void {
    const { ctx } = this;
    const { groundY } = game;
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, groundY, WIDTH, game.height - groundY);
    ctx.fillStyle = '#73bf2e';
    ctx.fillRect(0, groundY, WIDTH, 14);
    ctx.fillStyle = '#5ea024';
    for (let x = -game.groundX; x < WIDTH; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 14);
      ctx.lineTo(x + 12, groundY);
      ctx.lineTo(x + 20, groundY);
      ctx.lineTo(x + 8, groundY + 14);
      ctx.fill();
    }
    ctx.fillStyle = INK;
    ctx.fillRect(0, groundY, WIDTH, 2.5);
    ctx.fillRect(0, groundY + 14, WIDTH, 2);
  }

  private drawBird(game: Game): void {
    const { ctx } = this;
    const { bird } = game;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rot);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = INK;

    ctx.fillStyle = '#f8d32b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const wingY = bird.wing > 0 ? -6 : (Math.sin(game.t * 14) > 0 && game.state !== 'dying' ? 2 : 4);
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.ellipse(-6, wingY, 8, 5.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(7, -5, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(8.5, -5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f2711c';
    ctx.beginPath();
    ctx.moveTo(10, 1);
    ctx.lineTo(22, 4);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private outlinedText(text: string, x: number, y: number, size: number): void {
    const { ctx } = this;
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = INK;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);
  }

  private drawReady(height: number, hint: string): void {
    this.outlinedText('Get ready', WIDTH / 2, height * 0.28, 40);
    this.outlinedText(hint, WIDTH / 2, height * 0.58, 20);
  }

  // Live mic readout on the ground strip, so you can see what the game sees.
  private drawMeter(groundY: number, meter: Meter): void {
    const { ctx } = this;
    const x = 20, w = WIDTH - 40, y = groundY + 40, h = 12;
    ctx.font = `700 12px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#5a4a2a';

    if (meter.kind === 'message') {
      ctx.fillText(meter.text, x, y + h);
      return;
    }

    ctx.fillText(meter.label, x, y - 4);
    ctx.fillStyle = 'rgba(43,29,14,0.15)';
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = meter.hot ? '#f2711c' : '#f8d32b';
    ctx.fillRect(x, y, w * meter.level, h);
    const tick = x + w * meter.threshold;
    ctx.fillStyle = INK;
    ctx.fillRect(tick - 1, y - 3, 2, h + 6);
  }
}
