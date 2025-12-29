// 32-square indexing helpers and coordinate math for an 8x8 board.
// Indexing: 0..31 in row-major over dark squares (top to bottom).

export function bit(i: number): number {
  return 1 << i;
}

export function indexToCoord(i: number): { r: number; c: number } {
  const r = Math.floor(i / 4);
  const base = (i % 4) * 2;
  const c = (r % 2 === 0) ? base + 1 : base;
  return { r, c };
}

export function coordToIndex(r: number, c: number): number {
  if ((r | c) < 0 || r > 7 || c > 7) return -1;
  if (((r + c) & 1) === 0) return -1;
  return r * 4 + (c >> 1);
}

export function isDark(r: number, c: number): boolean {
  return ((r + c) & 1) === 1;
}

export function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function squares(bits: number): number[] {
  const res: number[] = [];
  while (bits) {
    const lsb = bits & -bits;
    const i = Math.clz32(lsb) ^ 31;
    res.push(i);
    bits ^= lsb;
  }
  return res;
}

export function occupied(bm: number, bk: number, wm: number, wk: number): number {
  return (bm | bk | wm | wk) >>> 0;
}

