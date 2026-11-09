import { describe, it, expect } from "vitest";
import { formatResult, assertCap, CapExceededError } from "../src/report.js";
import { mulberry32 } from "../src/rng.js";

describe("formatResult", () => {
  const out = formatResult("2 + 3", { answer: 5, report: ["Built 5 nodes."] }, 12);

  it("puts the answer on the first line", () => {
    expect(out.split("\n")[0]).toBe("2 + 3 = 5");
  });

  it("includes the methodology report, timing and the calculator comparison", () => {
    expect(out).toContain("Methodology report");
    expect(out).toContain("Built 5 nodes.");
    expect(out).toContain("12 ms");
    expect(out).toContain("A $1 pocket calculator would have done this in under a millisecond.");
  });
});

describe("assertCap", () => {
  it("throws CapExceededError with the standard message above the cap", () => {
    expect(() => assertCap("a", 51, 50, "Q.")).toThrow(CapExceededError);
    expect(() => assertCap("a", 51, 50, "Q.")).toThrow("a exceeds the supported maximum of 50. Q.");
  });

  it("allows values at the cap", () => {
    expect(() => assertCap("a", 50, 50, "Q.")).not.toThrow();
  });
});

describe("mulberry32", () => {
  it("is deterministic and in [0, 1)", () => {
    const r1 = mulberry32(1), r2 = mulberry32(1);
    const s1 = Array.from({ length: 1000 }, r1);
    const s2 = Array.from({ length: 1000 }, r2);
    expect(s1).toEqual(s2);
    expect(s1.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});
