import { describe, it, expect } from "vitest";
import { monteCarloMultiply } from "../src/engines/multiply.js";
import { CapExceededError } from "../src/report.js";
import { mulberry32, type Rng } from "../src/rng.js";

const VALUES = [0, 1, 7, 13, 50];
const PAIRS = VALUES.flatMap((a) => VALUES.map((b) => [a, b] as const));

describe("monteCarloMultiply", () => {
  it.each(PAIRS)("multiplies %i × %i correctly", (a, b) => {
    expect(monteCarloMultiply(a, b, mulberry32(a * 100 + b)).answer).toBe(a * b);
  }, 20_000);

  it("short-circuits when an input is zero", () => {
    expect(monteCarloMultiply(0, 9).report.join("\n")).toContain("No darts were required");
  });

  it("reports darts, the confidence interval and the audit", () => {
    const report = monteCarloMultiply(7, 13, mulberry32(1)).report.join("\n");
    expect(report).toMatch(/[\d,]+ darts/);
    expect(report).toContain("confidence interval");
    expect(report).toContain("Audit: passed");
  });

  it("reruns the experiment when the audit rejects an attempt", () => {
    let calls = 0;
    const fallback = mulberry32(7);
    const rigged: Rng = () => (calls++ < 20_000 ? 0.999 : fallback());
    const result = monteCarloMultiply(3, 4, rigged, 10_000);
    expect(result.answer).toBe(12);
    expect(result.report.join("\n")).toContain("1 attempt rejected by audit");
  });

  it("finishes the worst case under the caps in reasonable time", () => {
    const start = Date.now();
    expect(monteCarloMultiply(50, 25).answer).toBe(1250);
    expect(Date.now() - start).toBeLessThan(10_000);
  }, 20_000);

  it("rejects inputs above the cap", () => {
    expect(() => monteCarloMultiply(51, 1)).toThrow(CapExceededError);
  });
});
