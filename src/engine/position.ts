import { bit, coordToIndex, indexToCoord, squares } from './bitboard';
import type { Move, Position, Side } from './types';

export const BLACK: Side = 0;
export const WHITE: Side = 1;

export function initialPosition(): Position {
  // Standard American checkers starting bitboards:
  // Top 3 rows black men, bottom 3 rows white men.
  let blackMen = 0;
  let whiteMen = 0;
  for (let i = 0; i < 12; i++) blackMen |= bit(i);
  for (let i = 20; i < 32; i++) whiteMen |= bit(i);
  return {
    men: [blackMen >>> 0, whiteMen >>> 0],
    kings: [0, 0],
    turn: WHITE,
    halfmoveClock: 0
  };
}

export function clone(pos: Position): Position {
  return {
    men: [pos.men[0] >>> 0, pos.men[1] >>> 0],
    kings: [pos.kings[0] >>> 0, pos.kings[1] >>> 0],
    turn: pos.turn,
    halfmoveClock: pos.halfmoveClock
  };
}

export function sidePieces(pos: Position, side: Side): number {
  return (pos.men[side] | pos.kings[side]) >>> 0;
}

export function other(side: Side): Side {
  return (side ^ 1) as Side;
}

export function isKingAt(pos: Position, side: Side, idx: number): boolean {
  return ((pos.kings[side] >>> 0) & bit(idx)) !== 0;
}

export function isManAt(pos: Position, side: Side, idx: number): boolean {
  return ((pos.men[side] >>> 0) & bit(idx)) !== 0;
}

export function pieceAt(pos: Position, idx: number): { side: Side; king: boolean } | null {
  const b = bit(idx);
  if (pos.men[0] & b) return { side: 0, king: false };
  if (pos.kings[0] & b) return { side: 0, king: true };
  if (pos.men[1] & b) return { side: 1, king: false };
  if (pos.kings[1] & b) return { side: 1, king: true };
  return null;
}

function addIfValid(occ: number, r: number, c: number): number {
  const idx = coordToIndex(r, c);
  if (idx === -1) return -1;
  const mask = bit(idx);
  if ((occ & mask) !== 0) return -1;
  return idx;
}

export function generateMoves(pos: Position): Move[] {
  const side = pos.turn;
  const bm = pos.men[0], bk = pos.kings[0], wm = pos.men[1], wk = pos.kings[1];
  const occ = (bm | bk | wm | wk) >>> 0;
  const myMen = pos.men[side];
  const myKings = pos.kings[side];
  const captureMoves: Move[] = [];
  const quietMoves: Move[] = [];

  // Generate captures first (forced capture rule)
  for (const i of squares((myMen | myKings) >>> 0)) {
    const isKing = ((myKings >>> 0) & bit(i)) !== 0;
    genCapturesFrom(pos, i, isKing, side, captureMoves);
  }
  if (captureMoves.length) return captureMoves;

  // Quiet moves
  for (const i of squares((myMen | myKings) >>> 0)) {
    const { r, c } = indexToCoord(i);
    const isKing = ((myKings >>> 0) & bit(i)) !== 0;
    if (side === 1 || isKing) {
      // white forward (up): r-1
      let to = addIfValid(occ, r - 1, c - 1);
      if (to !== -1) quietMoves.push(mkMove(i, to, false, isKing));
      to = addIfValid(occ, r - 1, c + 1);
      if (to !== -1) quietMoves.push(mkMove(i, to, false, isKing));
    }
    if (side === 0 || isKing) {
      // black forward (down): r+1
      let to = addIfValid(occ, r + 1, c - 1);
      if (to !== -1) quietMoves.push(mkMove(i, to, false, isKing));
      to = addIfValid(occ, r + 1, c + 1);
      if (to !== -1) quietMoves.push(mkMove(i, to, false, isKing));
    }
  }
  return quietMoves;
}

function mkMove(from: number, to: number, isCapture: boolean, wasKing: boolean, path?: number[], captures?: number[]): Move {
  const res: Move = {
    from, to,
    isCapture,
    wasKing,
    path: path ?? [from, to],
    captures: captures ?? [],
    promote: false
  };
  return res;
}

function genCapturesFrom(pos: Position, i: number, isKing: boolean, side: Side, out: Move[]) {
  const dirs = [
    { dr: -1, dc: -1, er: -2, ec: -2 }, // up-left
    { dr: -1, dc: +1, er: -2, ec: +2 }, // up-right
    { dr: +1, dc: -1, er: +2, ec: -2 }, // down-left
    { dr: +1, dc: +1, er: +2, ec: +2 }  // down-right
  ];
  const allowed = (d: { dr: number; dc: number }) => {
    if (isKing) return true;
    return (side === 1 && d.dr === -1) || (side === 0 && d.dr === +1);
  };

  const startMen0 = pos.men[0], startKings0 = pos.kings[0];
  const startMen1 = pos.men[1], startKings1 = pos.kings[1];

  const results: Move[] = [];

  function dfs(at: number, men0: number, kings0: number, men1: number, kings1: number, path: number[], caps: number[]) {
    const { r, c } = indexToCoord(at);
    let extended = false;

    for (const d of dirs) {
      if (!allowed(d)) continue;
      const mr = r + d.dr, mc = c + d.dc;
      const er = r + d.er, ec = c + d.ec;
      const mid = coordToIndex(mr, mc);
      const end = coordToIndex(er, ec);
      if (mid === -1 || end === -1) continue;
      const endMask = bit(end);
      const occ = (men0 | kings0 | men1 | kings1) >>> 0;
      if (occ & endMask) continue; // landing must be empty

      // Check mid is opponent
      const oppMen = side === 0 ? men1 : men0;
      const oppKings = side === 0 ? kings1 : kings0;
      const midMask = bit(mid);
      if (!((oppMen | oppKings) & midMask)) continue;

      // Apply capture on bitboards
      let nMen0 = men0, nKings0 = kings0, nMen1 = men1, nKings1 = kings1;
      // Remove captured piece
      if (side === 0) {
        if (nMen1 & midMask) nMen1 &= ~midMask;
        else nKings1 &= ~midMask;
      } else {
        if (nMen0 & midMask) nMen0 &= ~midMask;
        else nKings0 &= ~midMask;
      }
      // Move our piece from 'at' to 'end'
      const fromMask = bit(at);
      if (side === 0) {
        if (!isKing) {
          nMen0 = (nMen0 & ~fromMask) | endMask;
        } else {
          nKings0 = (nKings0 & ~fromMask) | endMask;
        }
      } else {
        if (!isKing) {
          nMen1 = (nMen1 & ~fromMask) | endMask;
        } else {
          nKings1 = (nKings1 & ~fromMask) | endMask;
        }
      }

      extended = true;
      dfs(end, nMen0 >>> 0, nKings0 >>> 0, nMen1 >>> 0, nKings1 >>> 0, [...path, end], [...caps, mid]);
    }

    if (!extended && caps.length) {
      results.push(mkMove(i, at, true, isKing, path, caps));
    }
  }

  dfs(i, startMen0, startKings0, startMen1, startKings1, [i], []);
  out.push(...results);
}

export function applyMove(pos: Position, m: Move): Position {
  const side = pos.turn;
  let bm = pos.men[0], bk = pos.kings[0], wm = pos.men[1], wk = pos.kings[1];
  const fromMask = bit(m.from);
  const toMask = bit(m.to);
  const moverIsBlack = side === 0;

  // Remove from source
  if (moverIsBlack) {
    if (bm & fromMask) bm &= ~fromMask;
    else bk &= ~fromMask;
  } else {
    if (wm & fromMask) wm &= ~fromMask;
    else wk &= ~fromMask;
  }

  // Captures
  if (m.isCapture) {
    for (const cap of m.captures) {
      const mask = bit(cap);
      if (moverIsBlack) {
        // remove white
        if (wm & mask) wm &= ~mask; else wk &= ~mask;
      } else {
        if (bm & mask) bm &= ~mask; else bk &= ~mask;
      }
    }
  }

  // Place to destination (consider promotion)
  const { r: toR } = indexToCoord(m.to);
  let promoted = false;
  if (moverIsBlack) {
    const reachBackRank = toR === 7;
    if (m.wasKing || reachBackRank) {
      bk |= toMask;
      promoted = !m.wasKing && reachBackRank;
    } else {
      bm |= toMask;
    }
  } else {
    const reachBackRank = toR === 0;
    if (m.wasKing || reachBackRank) {
      wk |= toMask;
      promoted = !m.wasKing && reachBackRank;
    } else {
      wm |= toMask;
    }
  }

  return {
    men: [bm >>> 0, wm >>> 0],
    kings: [bk >>> 0, wk >>> 0],
    turn: other(side),
    halfmoveClock: m.isCapture || promoted ? 0 : (pos.halfmoveClock + 1)
  };
}

export function isTerminal(pos: Position): { done: boolean; result: 1 | 0 | -1 | null } {
  const myPieces = sidePieces(pos, pos.turn);
  if (myPieces === 0) {
    // Side to move has no pieces: loss
    return { done: true, result: -1 };
  }
  const moves = generateMoves(pos);
  if (moves.length === 0) {
    // No legal moves: loss
    return { done: true, result: -1 };
  }
  if (pos.halfmoveClock >= 100) {
    return { done: true, result: 0 }; // 50-move rule
  }
  return { done: false, result: null };
}
