import type { Move, Position, Side } from '../engine/types';
import { WHITE, applyMove, generateMoves, initialPosition, pieceAt } from '../engine/position';
import { coordToIndex, indexToCoord, isDark } from '../engine/bitboard';

export type BoardCallbacks = {
  onMove: (move: Move, newPos: Position) => void;
  requestHint: () => void;
};

export class BoardView {
  private el: HTMLElement;
  private pos: Position;
  private selected: number | null = null;
  private legal: Move[] = [];
  private callbacks: BoardCallbacks;
  private precogSquares: Set<number> = new Set();
  private humanSide: Side = WHITE;
  private flashIdx: number | null = null;

  constructor(container: HTMLElement, callbacks: BoardCallbacks) {
    this.el = container;
    this.pos = initialPosition();
    this.callbacks = callbacks;
    this.renderBase();
    this.refresh();
    this.el.addEventListener('click', (e) => this.onClick(e));
  }

  setPosition(pos: Position) {
    this.pos = pos;
    this.selected = null;
    this.legal = [];
    this.refresh();
  }

  setHumanSide(side: Side) {
    this.humanSide = side;
    this.refresh();
  }

  setPrecog(path: number[]) {
    this.precogSquares = new Set(path);
    this.refreshHighlights();
  }

  clearPrecog() {
    this.precogSquares.clear();
    this.refreshHighlights();
  }

  flashPiece(idx: number) {
    this.flashIdx = idx;
    this.refresh();
  }

  clearFlash() {
    this.flashIdx = null;
    this.refresh();
  }

  private renderBase() {
    this.el.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = document.createElement('div');
        cell.className = `cell ${isDark(r, c) ? 'dark' : 'light'}`;
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.setAttribute('role', 'gridcell');
        this.el.appendChild(cell);
      }
    }
  }

  private refresh() {
    // pieces
    for (const cell of Array.from(this.el.children) as HTMLElement[]) {
      cell.innerHTML = '';
    }
    // draw pieces
    for (let i = 0; i < 32; i++) {
      const piece = pieceAt(this.pos, i);
      if (!piece) continue;
      const { r, c } = indexToCoord(i);
      const cell = this.cellAt(r, c);
      const p = document.createElement('div');
      p.className = `piece ${piece.side === WHITE ? 'white' : 'black'} ${piece.king ? 'king' : ''}`;
      p.dataset.idx = String(i);
      if (this.flashIdx === i) p.classList.add('flash');
      cell.appendChild(p);
    }
    this.refreshHighlights();
  }

  private refreshHighlights() {
    for (const cell of Array.from(this.el.children) as HTMLElement[]) {
      cell.classList.remove('highlight', 'pv');
    }
    if (this.selected != null) {
      const moves = this.legal.filter(m => m.from === this.selected);
      for (const m of moves) {
        const { r, c } = indexToCoord(m.to);
        this.cellAt(r, c).classList.add('highlight');
      }
    }
    if (this.precogSquares.size) {
      for (const sq of this.precogSquares) {
        const { r, c } = indexToCoord(sq);
        this.cellAt(r, c).classList.add('pv');
      }
    }
  }

  private onClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const cell = target.closest('.cell') as HTMLElement | null;
    if (!cell) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const idx = coordToIndex(r, c);
    if (idx === -1) return;

    if (this.selected == null) {
      // select if it's our piece
      const piece = pieceAt(this.pos, idx);
      if (piece && piece.side === this.pos.turn && piece.side === this.humanSide) {
        this.selected = idx;
        this.legal = generateMoves(this.pos);
        this.refreshHighlights();
      }
      return;
    }

    // attempt move from selected -> idx
    const legalFrom = this.legal.filter(m => m.from === this.selected && m.to === idx);
    if (legalFrom.length) {
      const move = legalFrom[0];
      const newPos = applyMove(this.pos, move);
      this.pos = newPos;
      this.selected = null;
      this.legal = [];
      this.refresh();
      this.callbacks.onMove(move, newPos);
    } else {
      // reselect if clicking own piece
      const piece = pieceAt(this.pos, idx);
      if (piece && piece.side === this.pos.turn && piece.side === this.humanSide) {
        this.selected = idx;
        this.legal = generateMoves(this.pos);
      } else {
        this.selected = null;
        this.legal = [];
      }
      this.refreshHighlights();
    }
  }

  private cellAt(r: number, c: number): HTMLElement {
    return this.el.children[r * 8 + c] as HTMLElement;
  }
}
