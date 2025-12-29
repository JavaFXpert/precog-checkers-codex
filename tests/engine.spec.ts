import { describe, it, expect } from 'vitest';
import { initialPosition, generateMoves, applyMove } from '../src/engine/position';

describe('engine basics', () => {
  it('initial position has legal moves', () => {
    const pos = initialPosition();
    const moves = generateMoves(pos);
    expect(moves.length).toBeGreaterThan(0);
  });

  it('apply move changes side to move', () => {
    const pos = initialPosition();
    const [m] = generateMoves(pos);
    const next = applyMove(pos, m);
    expect(next.turn).not.toEqual(pos.turn);
  });
});

