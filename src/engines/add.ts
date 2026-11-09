import { assertCap, type EngineResult } from "../report.js";
import { drawChain } from "../drawings.js";

interface PeanoNode {
  prev: PeanoNode | null;
}

const ZERO: PeanoNode = { prev: null };
const succ = (n: PeanoNode): PeanoNode => ({ prev: n });

/** Adds two numbers the way Giuseppe Peano intended: one successor at a time. */
export function peanoAdd(a: number, b: number): EngineResult {
  assertCap("a + b", a + b, 10_000, "The successor chain would exceed approved memory allocations.");

  let chain = ZERO;
  for (let i = 0; i < a; i++) chain = succ(chain);
  for (let i = 0; i < b; i++) chain = succ(chain);

  let count = 0;
  for (let node = chain; node.prev !== null; node = node.prev) count++;

  return {
    answer: count,
    report: [
      `Represented ${a} and ${b} as Peano numerals.`,
      `Constructed ${a + b} successor nodes on top of zero.`,
      `Counted the nodes by hand. Result verified by counting.`,
    ],
    drawing: drawChain(a, b),
  };
}
