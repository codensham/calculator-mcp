import { describe, it, expect } from "vitest";
import { tugOfWar } from "../src/engines/subtract.js";
import { CapExceededError } from "../src/report.js";
import { mulberry32 } from "../src/rng.js";

const run = (a: number, b: number) => tugOfWar(a, b, mulberry32(42));

describe("tugOfWar", () => {
  it.each([[5, 3], [3, 5], [4, 4], [0, 0], [1000, 1]])("computes %i - %i correctly", (a, b) => {
    expect(run(a, b).answer).toBe(a - b);
  });

  it("declares Team A the winner when a > b", () => {
    expect(run(5, 3).report.join("\n")).toContain("Team A wins");
  });

  it("declares Team B the winner when b > a", () => {
    expect(run(3, 5).report.join("\n")).toContain("Team B wins");
  });

  it("declares a draw when a = b", () => {
    expect(run(4, 4).report.join("\n")).toContain("draw");
  });

  it("abbreviates the match log for large teams", () => {
    expect(run(1000, 1000).report.length).toBeLessThanOrEqual(12);
  });

  it("rejects teams above the cap", () => {
    expect(() => tugOfWar(1001, 0)).toThrow(CapExceededError);
  });
});
