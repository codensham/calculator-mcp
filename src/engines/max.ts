import { assertCap, type EngineResult } from "../report.js";
import { drawTimers } from "../drawings.js";

const QUIP = "Waits longer than 30 seconds require a change request.";

interface Finish {
  value: number;
  finishedAt: number;
}

const sleepThenReport = (value: number): Promise<Finish> =>
  new Promise((resolve) => setTimeout(() => resolve({ value, finishedAt: Date.now() }), value * 1000));

/** Finds the larger number by sleeping for each and seeing which wakes up last. */
export async function sleepSort(a: number, b: number): Promise<EngineResult> {
  assertCap("a", a, 30, QUIP);
  assertCap("b", b, 30, QUIP);

  const order: Finish[] = [];
  await Promise.all([a, b].map((v) => sleepThenReport(v).then((f) => order.push(f))));

  const [first, last] = order;
  const tie = first.finishedAt === last.finishedAt;
  const waited = Math.max(a, b);

  return {
    answer: last.value,
    report: [
      `Started a ${a}-second timer and a ${b}-second timer simultaneously.`,
      tie
        ? `Both timers finished at the same time. It's a tie: both values are ${last.value}.`
        : `The ${first.value}-second timer finished first. The ${last.value}-second timer finished last and is declared the maximum.`,
      `Waited ${waited} ${waited === 1 ? "second" : "seconds"} in total.`,
    ],
    drawing: drawTimers(a, b),
  };
}
