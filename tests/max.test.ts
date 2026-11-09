import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sleepSort } from "../src/engines/max.js";
import { CapExceededError } from "../src/report.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function run(a: number, b: number) {
  const p = sleepSort(a, b);
  await vi.advanceTimersByTimeAsync(31_000);
  return p;
}

describe("sleepSort", () => {
  it.each([[3, 7, 7], [7, 3, 7], [0, 0, 0], [30, 29, 30]])("max(%i, %i) = %i", async (a, b, expected) => {
    expect((await run(a, b)).answer).toBe(expected);
  });

  it("reports a tie when both timers finish together", async () => {
    expect((await run(4, 4)).report.join("\n")).toContain("tie");
  });

  it("reports how long it waited", async () => {
    expect((await run(3, 7)).report.join("\n")).toContain("7 seconds");
  });

  it("does not settle before the longer timer fires", async () => {
    let settled = false;
    const p = sleepSort(3, 7).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(6_999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(settled).toBe(true);
  });

  it("rejects waits above the cap", async () => {
    await expect(sleepSort(31, 0)).rejects.toThrow(CapExceededError);
  });
});
