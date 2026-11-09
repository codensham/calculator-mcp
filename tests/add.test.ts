import { describe, it, expect } from "vitest";
import { peanoAdd } from "../src/engines/add.js";
import { CapExceededError } from "../src/report.js";

describe("peanoAdd", () => {
  it.each([[0, 0], [0, 7], [3, 4], [9999, 1]])("adds %i + %i correctly", (a, b) => {
    expect(peanoAdd(a, b).answer).toBe(a + b);
  });

  it("reports the number of successor nodes constructed", () => {
    expect(peanoAdd(3, 4).report.join("\n")).toContain("7 successor nodes");
  });

  it("rejects sums above the cap", () => {
    expect(() => peanoAdd(5000, 5001)).toThrow(CapExceededError);
  });

  it("handles the cap without overflowing the stack", () => {
    expect(peanoAdd(10000, 0).answer).toBe(10000);
  });
});
