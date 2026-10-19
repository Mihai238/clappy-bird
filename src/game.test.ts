import { describe, expect, it } from 'vitest';
import { Game, type Controls, type Mode } from './game.ts';
import { clamp } from './logic/math.ts';
import { FLAP_V, GAP } from './logic/physics.ts';

function setup(mode: Mode) {
  const died: number[] = [];
  const over: number[] = [];
  const controls: Controls & { tiltFn: () => number } = {
    mode,
    beta: 40,
    tiltFn: () => 0,
    tilt() { return this.tiltFn(); },
  };
  const game = new Game(controls, { onDie: s => died.push(s), onOver: s => over.push(s) }, () => 0.5);
  game.resize(640);
  return { game, controls, died, over };
}

function run(game: Game, seconds: number, eachFrame?: () => void): void {
  for (let t = 0; t < seconds; t += 1 / 60) {
    eachFrame?.();
    game.update(1 / 60);
  }
}

describe('Game', () => {
  it('waits on the ready screen until the first flap in Flick mode', () => {
    const { game } = setup('flick');
    game.newRun();
    run(game, 3);
    expect(game.state).toBe('ready');
    game.flap();
    expect(game.state).toBe('play');
    expect(game.bird.vy).toBe(FLAP_V);
    expect(game.pipes).toHaveLength(1);
  });

  it('starts Voice mode on the first sound, like a flap', () => {
    const { game } = setup('voice');
    game.newRun();
    game.flap();
    expect(game.state).toBe('play');
  });

  it('counts down in Tilt mode and takes the held angle as level', () => {
    const { game } = setup('tilt');
    game.newRun();
    game.flap();
    expect(game.state).toBe('ready');
    run(game, 2.1);
    expect(game.state).toBe('play');
    expect(game.neutral).toBe(40);
  });

  it('dies on the ground, then reports game over once', () => {
    const { game, died, over } = setup('flick');
    game.newRun();
    game.flap();
    run(game, 1.2);
    expect(game.state).toBe('dying');
    expect(died).toEqual([0]);
    run(game, 1);
    expect(game.state).toBe('over');
    expect(over).toEqual([0]);
  });

  it('dies on hitting a pipe', () => {
    const { game, died } = setup('flick');
    game.newRun();
    game.flap();
    game.pipes = [{ x: 80, top: 400, passed: false }];
    game.update(1 / 60);
    expect(game.state).toBe('dying');
    expect(died).toHaveLength(1);
  });

  it('keeps the bird below the ceiling', () => {
    const { game, controls } = setup('tilt');
    controls.tiltFn = () => 1;
    game.newRun();
    run(game, 2.1);
    run(game, 0.8);
    expect(game.bird.y).toBeGreaterThanOrEqual(game.bird.r);
  });

  it('scores a point for each pipe the bird flies through', () => {
    const { game, controls, died } = setup('tilt');
    // Steer towards the middle of the next gap.
    controls.tiltFn = () => {
      const next = game.pipes.find(p => !p.passed);
      return next ? clamp((game.bird.y - (next.top + GAP / 2)) / 40, -1, 1) : 0;
    };
    game.newRun();
    run(game, 2.1);
    run(game, 6);
    expect(died).toEqual([]);
    expect(game.score).toBeGreaterThanOrEqual(2);
  });
});
