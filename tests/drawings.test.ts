import { describe, it, expect } from "vitest";
import {
  drawChain,
  drawRope,
  drawDarts,
  drawHandoff,
  drawTimers,
  drawGuesses,
  MAX_WIDTH,
} from "../src/drawings.js";

const fits = (lines: string[]) => {
  for (const line of lines) expect(line.length, line).toBeLessThanOrEqual(MAX_WIDTH);
};

describe("drawChain", () => {
  it("draws one node per successor, marking which operand it came from", () => {
    const out = drawChain(2, 3).join("\n");
    expect(out.match(/●/g)).toHaveLength(2 + 1); // two nodes + legend
    expect(out.match(/○/g)).toHaveLength(3 + 1);
    expect(out).toContain("5");
  });

  it("elides the middle of long chains", () => {
    const lines = drawChain(9999, 1);
    expect(lines.join("\n")).toContain("┄");
    expect(lines.join("\n")).toContain("10,000");
    fits(lines);
  });

  it("handles an empty chain", () => {
    expect(drawChain(0, 0).join("\n")).toContain("0");
  });

  it.each([[0, 1], [3, 4], [7, 0], [5000, 5000]])("fits the width for %i + %i", (a, b) => fits(drawChain(a, b)));
});

describe("drawRope", () => {
  const marker = (lines: string[]) => lines[0].indexOf("●");
  const centre = (lines: string[]) => drawRope(1, 1, 0)[0].indexOf("●");

  it("pulls the marker toward Team A when A wins", () => {
    const lines = drawRope(9, 4, 5);
    expect(marker(lines)).toBeLessThan(centre(lines));
    expect(lines[0]).toContain("╪");
    expect(lines.join("\n")).toContain("+5");
  });

  it("pulls the marker toward Team B when B wins", () => {
    const lines = drawRope(4, 9, -5);
    expect(marker(lines)).toBeGreaterThan(centre(lines));
  });

  it("scales huge margins to fit", () => {
    const lines = drawRope(1000, 0, 1000);
    fits(lines);
    expect(lines.join("\n")).toContain("1 char =");
  });
});

describe("drawDarts", () => {
  const base = { a: 6, b: 7, side: 7, darts: 100_000, hitRate: 0.855, estimate: 41.911 };

  it("marks hits and misses either side of the rectangle edge", () => {
    const lines = drawDarts({ ...base, sample: [[0.5, 0.5], [6.5, 0.5]] });
    expect(lines[0]).toContain("┬");
    expect(lines[1]).toMatch(/\*.*│.*\./);
    expect(lines.join("\n")).toContain("100,000 darts");
    fits(lines);
  });

  it("draws a horizontal edge when the rectangle is short", () => {
    const lines = drawDarts({ ...base, a: 7, b: 3, sample: [] });
    expect(lines.some((l) => l.startsWith("├"))).toBe(true);
  });

  it("fits the worst-case labels", () => {
    fits(drawDarts({ a: 1, b: 50, side: 50, darts: 30_000_000, hitRate: 0.02, estimate: 50.123, sample: [] }));
  });
});

describe("drawHandoff", () => {
  it("shows the problem passing through the server untouched", () => {
    const out = drawHandoff("84 ÷ 7", 12, "claude-opus-5-5").join("\n");
    expect(out).toContain("claude-opus-5-5");
    expect(out).toContain("0 operations");
    expect(out.trim().endsWith("12")).toBe(true);
  });

  it("truncates long names and answers", () => {
    fits(drawHandoff("1000000 ÷ 1000000", "x".repeat(200), "m".repeat(200)));
  });
});

describe("drawTimers", () => {
  it("crowns the timer that woke last", () => {
    const [a, b] = drawTimers(3, 5);
    expect(a).not.toContain("max");
    expect(b).toContain("max");
    expect(b.match(/█/g)!.length).toBeGreaterThan(a.match(/█/g)!.length);
  });

  it("declares a tie", () => {
    expect(drawTimers(4, 4).every((l) => l.includes("tie"))).toBe(true);
  });

  it.each([[0, 0], [30, 29], [0, 30]])("fits the width for max(%i, %i)", (a, b) => fits(drawTimers(a, b)));
});

describe("drawGuesses", () => {
  it("lists the wrong guesses then the winner", () => {
    const lines = drawGuesses(10, { firstWrong: [7, 2], lastWrong: [], wrongCount: 2, winner: 3 });
    expect(lines[0]).toMatch(/7² = 49 +✗/);
    expect(lines.at(-1)).toMatch(/3² = 9 +✓/);
    expect(lines.at(-1)).toContain("1 left over");
  });

  it("summarises long guessing sprees", () => {
    const lines = drawGuesses(10_000, {
      firstWrong: [1, 2, 3],
      lastWrong: [9998, 9999],
      wrongCount: 9_000,
      winner: 100,
    });
    expect(lines.join("\n")).toContain("8,995 more wrong guesses");
    fits(lines);
  });
});
