import { initialPosition, applyMove } from './engine/position';
import type { Move, Position, Side } from './engine/types';
import { BoardView } from './ui/board';
import './style.css';

const boardEl = document.getElementById('board') as HTMLElement;
const statusText = document.getElementById('statusText')!;
const pvText = document.getElementById('pvText')!;
const moveList = document.getElementById('moveList') as HTMLOListElement;
const difficultySel = document.getElementById('difficulty') as HTMLSelectElement;
const sideSel = document.getElementById('side') as HTMLSelectElement;
const newGameBtn = document.getElementById('newGame') as HTMLButtonElement;
const hintBtn = document.getElementById('hint') as HTMLButtonElement;
const precogToggle = document.getElementById('precog') as HTMLInputElement;

const worker = new Worker(new URL('./worker/engine.worker.ts', import.meta.url), { type: 'module' });

let pos: Position = initialPosition();
let human: Side = 1;
let ai: Side = 0;
let searching = false;

const board = new BoardView(boardEl, {
  onMove: (m, newPos) => {
    addMoveToList(m);
    pos = newPos;
    worker.postMessage({ type: 'setpos', pos });
    updateStatus();
    maybeAiMove();
  },
  requestHint: () => requestHint()
});

function newGame() {
  pos = initialPosition();
  human = sideSel.value === 'white' ? 1 : 0;
  ai = (human === 1 ? 0 : 1) as Side;
  moveList.innerHTML = '';
  board.setHumanSide(human);
  board.setPosition(pos);
  worker.postMessage({ type: 'setpos', pos });
  pvText.textContent = '';
  updateStatus();
  if (pos.turn === ai) maybeAiMove();
}

function updateStatus() {
  const turnText = pos.turn === 1 ? 'White' : 'Black';
  const youText = pos.turn === human ? ' (You)' : '';
  statusText.textContent = `${turnText} to move${youText}`;
}

function maybeAiMove() {
  if (pos.turn !== ai || searching) return;
  searching = true;
  pvText.textContent = 'Thinking...';
  const timeMs = Number(difficultySel.value);
  worker.postMessage({ type: 'search', limits: { timeMs }, perspective: ai });
}

function applyAIMove(m: any) {
  // Move computed relative to current pos
  board.clearPrecog();
  pvText.textContent = formatPV(m.pv);
  if (precogToggle.checked && m.pv?.length) {
    const path = m.pv[0].path as number[];
    board.setPrecog(path);
  }
  // Flash the moving piece briefly before applying the move
  const fromIdx = m.move.from as number;
  board.flashPiece(fromIdx);
  window.setTimeout(() => {
    board.clearFlash();
    // Apply best move locally
    const nextPos = applyMoveLocal(pos, m.move);
    addMoveToList(m.move);
    pos = nextPos;
    board.setPosition(pos);
    worker.postMessage({ type: 'setpos', pos });
    updateStatus();
    searching = false;
  }, 1500);
}

function addMoveToList(m: Move) {
  const li = document.createElement('li');
  li.textContent = moveToNotation(m);
  moveList.appendChild(li);
}

function moveToNotation(m: Move): string {
  const join = m.isCapture ? 'x' : '-';
  return m.path.map(n => n + 1).join(join);
}

function formatPV(pv: any[]): string {
  if (!pv || !pv.length) return '';
  return pv.map((m: Move) => moveToNotation(m)).join(' ');
}

function requestHint() {
  if (searching) return;
  searching = true;
  const timeMs = Math.max(150, Math.floor(Number(difficultySel.value) / 2));
  worker.postMessage({ type: 'search', limits: { timeMs }, perspective: pos.turn });
}

function applyMoveLocal(p: Position, m: Move): Position {
  return applyMove(p, m);
}

worker.onmessage = (e) => {
  const data = e.data;
  if (data.type === 'bestmove') {
    applyAIMove(data);
  }
  if (data.type === 'info') {
    // no-op
  }
};

newGameBtn.addEventListener('click', () => newGame());
sideSel.addEventListener('change', () => newGame());
hintBtn.addEventListener('click', () => requestHint());
precogToggle.addEventListener('change', () => {
  if (!precogToggle.checked) board.clearPrecog();
});

newGame();
