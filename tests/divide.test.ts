import { describe, it, expect, vi } from "vitest";
import { askCaller, NobodyAvailableError, type DivideDeps } from "../src/engines/divide.js";

function deps(overrides: Partial<DivideDeps> = {}): DivideDeps {
  return {
    canSample: () => true,
    sample: async () => ({ text: "12", model: "m1" }),
    canElicit: () => false,
    elicit: async () => ({ action: "accept", answer: "12" }),
    ...overrides,
  };
}

describe("askCaller via sampling", () => {
  it("asks the calling model and returns its answer", async () => {
    const sample = vi.fn(async () => ({ text: "12", model: "m1" }));
    const result = await askCaller(84, 7, deps({ sample }));
    expect(result.answer).toBe(12);
    expect(sample).toHaveBeenCalledWith("Please compute 84 ÷ 7. Reply with only the number.");
    const report = result.report.join("\n");
    expect(report).toContain("m1");
    expect(report).toContain("0 arithmetic operations");
  });

  it("extracts a number from a prose reply", async () => {
    const result = await askCaller(25, 2, deps({ sample: async () => ({ text: "The answer is 12.5.", model: "m1" }) }));
    expect(result.answer).toBe(12.5);
  });

  it("returns the raw reply when it contains no number", async () => {
    const result = await askCaller(5, 0, deps({ sample: async () => ({ text: " undefined, obviously ", model: "m1" }) }));
    expect(result.answer).toBe("undefined, obviously");
  });

  it("forwards division by zero unchanged", async () => {
    const sample = vi.fn(async () => ({ text: "undefined", model: "m1" }));
    await askCaller(5, 0, deps({ sample }));
    expect(sample).toHaveBeenCalledWith("Please compute 5 ÷ 0. Reply with only the number.");
  });
});

describe("askCaller via elicitation", () => {
  it("asks the human when sampling is unsupported", async () => {
    const elicit = vi.fn(async () => ({ action: "accept" as const, answer: "12" }));
    const result = await askCaller(84, 7, deps({ canSample: () => false, canElicit: () => true, elicit }));
    expect(result.answer).toBe(12);
    expect(elicit).toHaveBeenCalledWith("Please divide 84 by 7.");
    expect(result.report.join("\n")).toContain("human");
  });

  it("falls back to the human when the sampling request fails", async () => {
    const result = await askCaller(
      84,
      7,
      deps({ sample: async () => Promise.reject(new Error("denied")), canElicit: () => true }),
    );
    expect(result.answer).toBe(12);
  });

  it("gives up when sampling fails and elicitation is unsupported", async () => {
    await expect(askCaller(84, 7, deps({ sample: async () => Promise.reject(new Error("denied")) }))).rejects.toThrow(
      NobodyAvailableError,
    );
  });

  it("gives up when the human declines", async () => {
    const p = askCaller(
      84,
      7,
      deps({ canSample: () => false, canElicit: () => true, elicit: async () => ({ action: "decline" }) }),
    );
    await expect(p).rejects.toThrow(NobodyAvailableError);
    await expect(p).rejects.toThrow(/declined/);
  });
});

describe("askCaller with nobody available", () => {
  it("fails when the client supports neither sampling nor elicitation", async () => {
    await expect(askCaller(84, 7, deps({ canSample: () => false }))).rejects.toThrow(
      "No one was available to perform the division.",
    );
  });
});

describe("askCaller reply parsing", () => {
  it.each([
    ["84 ÷ 7 = 12", 12],
    ["84 / 7 = 12.", 12],
    ["1,000,000", 1000000],
    ["−3", -3],
    [".5", 0.5],
    ["1.2e+3", 1200],
  ])("reads %j as %d", async (text, expected) => {
    const result = await askCaller(1, 1, deps({ sample: async () => ({ text, model: "m1" }) }));
    expect(result.answer).toBe(expected);
  });
});
