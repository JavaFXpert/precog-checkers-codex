import type { Position, Side } from './types';
import { BLACK, WHITE, sidePieces } from './position';
import { popcount32 } from './bitboard';

// Heuristic evaluation (centipawns, side-to-move perspective positive).
export function evaluate(pos: Position, perspective: Side): number {
  const bm = pos.men[0], bk = pos.kings[0], wm = pos.men[1], wk = pos.kings[1];
  const materialB = popcount32(bm) * 100 + popcount32(bk) * 300;
  const materialW = popcount32(wm) * 100 + popcount32(wk) * 300;
  // Mobility proxy: piece count and tempo
  const tempo = pos.turn === perspective ? 5 : -5;
  const mobility = 2 * (popcount32(sidePieces(pos, perspective)) - popcount32(sidePieces(pos, (perspective ^ 1) as Side)));

  const val = (perspective === WHITE ? (materialW - materialB) : (materialB - materialW)) + tempo + mobility;
  return val;
}

