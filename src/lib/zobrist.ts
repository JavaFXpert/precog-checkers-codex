import { Lcg } from './random';

export type Zobrist = {
  piece: bigint[][]; // [pieceType][square]
  side: bigint;
};

// pieceType indices:
// 0 = Black Man, 1 = Black King, 2 = White Man, 3 = White King
export function createZobrist(seed = 0x12345678): Zobrist {
  const rng = new Lcg(seed);
  const piece: bigint[][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 32 }, () => rng.nextBig())
  );
  const side = rng.nextBig();
  return { piece, side };
}

