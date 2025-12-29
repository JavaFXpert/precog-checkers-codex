/// <reference lib="webworker" />
import type { Position, SearchLimits, Side } from '../engine/types';
import { Searcher } from '../engine/search';
import { initialPosition } from '../engine/position';

type MsgIn =
  | { type: 'setpos'; pos: Position }
  | { type: 'search'; limits: SearchLimits; perspective: Side }
  | { type: 'stop' };

type MsgOut =
  | { type: 'bestmove'; move: any; pv: any[]; score: number; nodes: number; elapsedMs: number }
  | { type: 'info'; msg: string };

let pos: Position = initialPosition();
const searcher = new Searcher();

function post(o: MsgOut) { postMessage(o); }

onmessage = (e: MessageEvent<MsgIn>) => {
  const data = e.data;
  if (data.type === 'setpos') {
    pos = data.pos;
    post({ type: 'info', msg: 'position set' });
  } else if (data.type === 'search') {
    const { best, pv, score, nodes, elapsedMs } = searcher.search(pos, data.limits, data.perspective);
    if (best) {
      // Apply best to worker-side pos for continuous play if desired
      post({ type: 'bestmove', move: best, pv, score, nodes, elapsedMs });
    } else {
      post({ type: 'info', msg: 'no move' });
    }
  } else if (data.type === 'stop') {
    searcher.stop();
  }
};
