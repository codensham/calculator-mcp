import { describe, it, expect, vi } from "vitest";
import { peanoAdd } from "../src/engines/add.js";
import { tugOfWar } from "../src/engines/subtract.js";
import { monteCarloMultiply } from "../src/engines/multiply.js";
import { bogoRoot } from "../src/engines/sqrt.js";
import { sleepSort } from "../src/engines/max.js";
import { askCaller } from "../src/engines/divide.js";
import { mulberry32 } from "../src/rng.js";

describe("every engine draws what it did", () => {
  it("add draws the successor chain", () => {
    expect(peanoAdd(2, 3).drawing?.join("\n")).toContain("─▶");
  });

  it("subtract draws the rope", () => {
    expect(tugOfWar(9, 4, mulberry32(1)).drawing?.join("\n")).toContain("╪");
  });

  it("multiply draws the darts it actually threw", () => {
    const drawing = monteCarloMultiply(6, 7, mulberry32(1)).drawing!.join("\n");
    expect(drawing).toMatch(/\*/);
    expect(drawing).toContain("darts");
  });

  it("multiply explains the missing dartboard for zero", () => {
    expect(monteCarloMultiply(0, 7).drawing?.length).toBeGreaterThan(0);
  });

  it("sqrt draws its guesses ending in the winner", () => {
    expect(bogoRoot(10, mulberry32(3)).drawing?.at(-1)).toContain("✓");
  });

  it("max draws both timers", async () => {
    vi.useFakeTimers();
    const p = sleepSort(3, 5);
    await vi.advanceTimersByTimeAsync(6_000);
    vi.useRealTimers();
    expect((await p).drawing).toHaveLength(2);
  });

  it("divide draws the hand-off to whoever did the work", async () => {
    const result = await askCaller(84, 7, {
      canSample: () => true,
      sample: async () => ({ text: "12", model: "m1" }),
      canElicit: () => false,
      elicit: async () => ({ action: "cancel" }),
    });
    expect(result.drawing?.join("\n")).toContain("m1");
  });
});
