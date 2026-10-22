import { describe, expect, it } from 'vitest';
import { Game } from './game.ts';
import { FLAP_V, GAP } from './logic/physics.ts';

function setup() {
  const died: number[] = [];
  const over: number[] = [];
  const game = new Game({ onDie: s => died.push(s), onOver: s => over.push(s) }, () => 0.5);
  game.resize(640);
  return { game, died, over };
}

function run(game: Game, seconds: number, eachFrame?: () => void): void {
  for (let t = 0; t < seconds; t += 1 / 60) {
    eachFrame?.();
    game.update(1 / 60);
  }
}

describe('Game', () => {
  it('waits on the ready screen until the first flap', () => {
    const { game } = setup();
    game.newRun();
    run(game, 3);
    expect(game.state).toBe('ready');
    game.flap();
    expect(game.state).toBe('play');
    expect(game.bird.vy).toBe(FLAP_V);
    expect(game.pipes).toHaveLength(1);
  });

  it('dies on the ground, then reports game over once', () => {
    const { game, died, over } = setup();
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
    const { game, died } = setup();
    game.newRun();
    game.flap();
    game.pipes = [{ x: 80, top: 400, passed: false }];
    game.update(1 / 60);
    expect(game.state).toBe('dying');
    expect(died).toHaveLength(1);
  });

  it('keeps the bird below the ceiling', () => {
    const { game } = setup();
    game.newRun();
    game.flap();
    game.pipes = [];
    run(game, 0.8, () => {
      game.flap();
      game.pipes = [];
    });
    expect(game.bird.y).toBeGreaterThanOrEqual(game.bird.r);
  });

  it('scores a point for each pipe the bird flies through', () => {
    const { game, died } = setup();
    game.newRun();
    game.flap();
    // Flap whenever the bird sinks below the middle of the next gap.
    run(game, 6, () => {
      const next = game.pipes.find(p => !p.passed);
      if (next && game.bird.y > next.top + GAP / 2 + 10 && game.bird.vy > 0) game.flap();
    });
    expect(died).toEqual([]);
    expect(game.score).toBeGreaterThanOrEqual(2);
  });
});
