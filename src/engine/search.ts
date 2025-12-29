import type { Move, Position, SearchLimits, Side } from './types';
import { applyMove, generateMoves, isTerminal, other } from './position';
import { createZobrist } from '../lib/zobrist';

type Bound = 'EXACT' | 'LOWER' | 'UPPER';
type TTEntry = { depth: number; score: number; flag: Bound; best?: Move; z: bigint };

const Z = createZobrist(0x31415926);

function hash(pos: Position): bigint {
  let h = 0n;
  for (let sq = 0; sq < 32; sq++) {
    const mask = 1 << sq;
    if (pos.men[0] & mask) h ^= Z.piece[0][sq];
    if (pos.kings[0] & mask) h ^= Z.piece[1][sq];
    if (pos.men[1] & mask) h ^= Z.piece[2][sq];
    if (pos.kings[1] & mask) h ^= Z.piece[3][sq];
  }
  if (pos.turn === 1) h ^= Z.side;
  return h;
}

export class Searcher {
  private tt = new Map<bigint, TTEntry>();
  private abort = false;
  private start = 0;
  private timeMs = 0;
  private nodes = 0;
  private pv: Move[] = [];
  private maxDepth = 32;
  private perspective: Side = 1;

  search(pos: Position, limits: SearchLimits, perspective: Side) {
    this.abort = false;
    this.start = performance.now();
    this.timeMs = limits.timeMs;
    this.maxDepth = limits.maxDepth ?? 32;
    this.nodes = 0;
    this.pv = [];
    this.perspective = perspective;
    let best: Move | undefined;
    let bestScore = -Infinity;
    for (let depth = 1; depth <= this.maxDepth; depth++) {
      const { score, move, pv } = this.iterate(pos, depth, best);
      if (this.abort) break;
      if (move) {
        best = move;
        bestScore = score;
        this.pv = pv;
      }
    }
    return { best, pv: this.pv, score: bestScore, nodes: this.nodes, elapsedMs: performance.now() - this.start };
  }

  stop() { this.abort = true; }

  private timeUp() {
    return performance.now() - this.start >= this.timeMs;
  }

  private iterate(pos: Position, depth: number, prevBest?: Move) {
    const alpha = -Infinity, beta = +Infinity;
    const { score, best } = this.alphaBeta(pos, depth, alpha, beta);
    const pv = this.extractPv(pos, depth);
    return { score, move: best ?? prevBest, pv };
  }

  private alphaBeta(pos: Position, depth: number, alpha: number, beta: number): { score: number; best?: Move } {
    if (this.abort || this.timeUp()) { this.abort = true; return { score: 0 }; }
    this.nodes++;
    const h = hash(pos);
    const tt = this.tt.get(h);
    if (tt && tt.depth >= depth) {
      if (tt.flag === 'EXACT') return { score: tt.score, best: tt.best };
      if (tt.flag === 'LOWER' && tt.score > alpha) alpha = tt.score;
      else if (tt.flag === 'UPPER' && tt.score < beta) beta = tt.score;
      if (alpha >= beta) return { score: tt.score, best: tt.best };
    }

    const term = isTerminal(pos);
    if (term.done) {
      const s = term.result === 1 ? 100000 : term.result === -1 ? -100000 : 0;
      return { score: s };
    }
    if (depth === 0) {
      const s = this.qsearch(pos, alpha, beta);
      return { score: s };
    }

    // Move ordering: prefer TT move then captures first
    const moves = generateMoves(pos);
    let bestMove: Move | undefined = tt?.best;
    if (bestMove) {
      const idx = moves.findIndex(m => eqMove(m, bestMove!));
      if (idx > 0) [moves[0], moves[idx]] = [moves[idx], moves[0]];
    }
    moves.sort((a, b) => Number(b.isCapture) - Number(a.isCapture));

    let value = -Infinity;
    let localBest: Move | undefined;
    const alpha0 = alpha;
    for (const m of moves) {
      const child = applyMove(pos, m);
      const { score } = this.alphaBeta(child, depth - 1, -beta, -alpha);
      const v = -score;
      if (v > value) {
        value = v;
        localBest = m;
      }
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
      if (this.abort) break;
    }

    let flag: Bound = 'EXACT';
    if (value <= alpha0) flag = 'UPPER';
    else if (value >= beta) flag = 'LOWER';
    this.tt.set(h, { depth, score: value, flag, best: localBest, z: h });
    return { score: value, best: localBest };
  }

  private qsearch(pos: Position, alpha: number, beta: number): number {
    if (this.abort || this.timeUp()) { this.abort = true; return 0; }
    // Stand pat is not meaningful without a static eval; use simple material/tempo
    const stand = this.staticEval(pos, this.perspective);
    if (stand > alpha) alpha = stand;
    if (alpha >= beta) return alpha;

    const moves = generateMoves(pos).filter(m => m.isCapture);
    for (const m of moves) {
      const child = applyMove(pos, m);
      const v = -this.qsearch(child, -beta, -alpha);
      if (v > alpha) alpha = v;
      if (alpha >= beta || this.abort) break;
    }
    return alpha;
  }

  private staticEval(pos: Position, perspective: Side): number {
    // Lightweight inline evaluation to keep qsearch fast
    const bm = countBits(pos.men[0]) * 100 + countBits(pos.kings[0]) * 300;
    const wm = countBits(pos.men[1]) * 100 + countBits(pos.kings[1]) * 300;
    return perspective === 1 ? (wm - bm) : (bm - wm);
  }

  private extractPv(pos: Position, depth: number): Move[] {
    const pv: Move[] = [];
    let cur = pos;
    for (let d = 0; d < depth; d++) {
      const e = this.tt.get(hash(cur));
      if (!e?.best) break;
      pv.push(e.best);
      cur = applyMove(cur, e.best);
    }
    return pv;
  }
}

function countBits(n: number) { return Math.clz32(n) !== 32 ? (n.toString(2).match(/1/g)?.length ?? 0) : 0; }

function eqMove(a: Move, b: Move) {
  if (a.from !== b.from || a.to !== b.to || a.isCapture !== b.isCapture) return false;
  if (a.isCapture && (a.captures.length !== b.captures.length)) return false;
  for (let i = 0; i < a.captures.length; i++) if (a.captures[i] !== b.captures[i]) return false;
  return true;
}
