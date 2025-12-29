export type Side = 0 | 1; // 0 black (top), 1 white (bottom)

export type Position = {
  men: [number, number]; // [blackMen, whiteMen] bitboards on 32 squares
  kings: [number, number]; // [blackKings, whiteKings]
  turn: Side;
  halfmoveClock: number; // for 50-move rule
};

export type Move = {
  from: number; // 0..31
  to: number; // 0..31
  path: number[]; // includes from ... to (for multi-capture)
  captures: number[]; // captured square indices
  isCapture: boolean;
  wasKing: boolean; // mover originally a king
  promote: boolean;
};

export type SearchLimits = {
  timeMs: number;
  maxDepth?: number;
};

export type Pv = Move[];

