import { describe, it, expect } from "vitest";
import { bogoRoot } from "../src/engines/sqrt.js";
import { CapExceededError } from "../src/report.js";
import { mulberry32 } from "../src/rng.js";

const run = (n: number) => bogoRoot(n, mulberry32(3));

describe("bogoRoot", () => {
  it.each([[0, 0], [1, 1], [49, 7], [10000, 100]])("finds the exact root of %i", (n, root) => {
    expect(run(n).answer).toBe(root);
  });

  it.each([[10, "3 remainder 1"], [2, "1 remainder 1"], [9999, "99 remainder 198"]])(
    "returns the integer root and remainder of %i",
    (n, expected) => {
      expect(run(n).answer).toBe(expected);
    },
  );

  it("is exactly correct for every n from 0 to 500", () => {
    for (let n = 0; n <= 500; n++) {
      const answer = String(run(n).answer);
      const [g, r = 0] = answer.split(" remainder ").map(Number);
      expect(g * g).toBeLessThanOrEqual(n);
      expect((g + 1) * (g + 1)).toBeGreaterThan(n);
      expect(r).toBe(n - g * g);
    }
  });

  it("reports the number of guesses", () => {
    expect(run(49).report.join("\n")).toContain("guesses");
  });

  it("declares the irrational part out of scope for non-perfect squares", () => {
    expect(run(10).report.join("\n")).toContain("out of scope for this release");
  });

  it("rejects n above the cap", () => {
    expect(() => bogoRoot(10001)).toThrow(CapExceededError);
  });
});
