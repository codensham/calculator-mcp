import { assertCap, type EngineResult } from "../report.js";
import type { Rng } from "../rng.js";

const QUIP = "The dartboard procurement budget does not stretch that far.";
const BATCH = 100_000;
const Z_95 = 1.96;

/**
 * Multiplies a × b by throwing random darts at an a×b rectangle inside a square
 * box and estimating its area. An independent auditor then checks the result.
 */
export function monteCarloMultiply(
  a: number,
  b: number,
  rng: Rng = Math.random,
  maxDartsPerAttempt = 30_000_000,
): EngineResult {
  assertCap("a", a, 50, QUIP);
  assertCap("b", b, 50, QUIP);

  if (a === 0 || b === 0) {
    return {
      answer: 0,
      report: ["One side of the rectangle has zero length. No darts were required.", "Audit: waived."],
    };
  }

  const side = Math.max(a, b);
  const box = side * side;
  let rejected = 0;

  for (;;) {
    let darts = 0;
    let hits = 0;
    let se = Infinity;
    while (darts < maxDartsPerAttempt) {
      const batch = Math.min(BATCH, maxDartsPerAttempt - darts);
      for (let i = 0; i < batch; i++) {
        const x = rng() * side;
        const y = rng() * side;
        if (x < a && y < b) hits++;
      }
      darts += batch;
      const p = hits / darts;
      se = box * Math.sqrt((p * (1 - p)) / darts);
      if (Z_95 * se < 0.5) break;
    }

    const estimate = (hits / darts) * box;
    const rounded = Math.round(estimate);
    if (rounded !== a * b) {
      rejected++;
      continue;
    }

    return {
      answer: rounded,
      report: [
        `Placed a ${a}×${b} rectangle inside a ${side}×${side} bounding box (area ${box}).`,
        `Threw ${darts.toLocaleString("en-US")} darts. Hit rate: ${((hits / darts) * 100).toFixed(4)}%.`,
        `Estimated area: ${estimate.toFixed(3)}, 95% confidence interval [${(estimate - Z_95 * se).toFixed(3)}, ${(estimate + Z_95 * se).toFixed(3)}].`,
        `Rounded to ${rounded}.`,
        "Audit: passed (independent auditor: the * operator).",
        ...(rejected > 0
          ? [`${rejected} attempt${rejected === 1 ? "" : "s"} rejected by audit and rerun from scratch.`]
          : []),
      ],
    };
  }
}
