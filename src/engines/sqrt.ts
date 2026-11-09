import { assertCap, type EngineResult } from "../report.js";
import type { Rng } from "../rng.js";

/** Finds the integer square root of n by guessing random numbers until one works. */
export function bogoRoot(n: number, rng: Rng = Math.random): EngineResult {
  assertCap("n", n, 10_000, "The guessing department is at capacity.");

  let guesses = 0;
  let g: number;
  do {
    g = Math.floor(rng() * (n + 1));
    guesses++;
  } while (!(g * g <= n && (g + 1) * (g + 1) > n));

  const remainder = n - g * g;
  return {
    answer: remainder === 0 ? g : `${g} remainder ${remainder}`,
    report: [
      `Guessed random integers between 0 and ${n} until one squared correctly.`,
      `Number of guesses: ${guesses}. Winning guess: ${g} (${g} × ${g} = ${g * g}).`,
      ...(remainder === 0
        ? []
        : [`${n} is not a perfect square. The irrational part is out of scope for this release.`]),
    ],
  };
}
