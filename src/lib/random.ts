export class Lcg {
  private state: number;
  constructor(seed = 0xdeadbeef) {
    this.state = seed >>> 0;
  }
  next(): number {
    // LCG parameters (Numerical Recipes)
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state;
  }
  nextBig(): bigint {
    const a = BigInt(this.next());
    const b = BigInt(this.next());
    return (a << 32n) ^ b;
  }
}

