import { assertCap, type EngineResult } from "../report.js";
import type { Rng } from "../rng.js";

const QUIP = "The venue cannot accommodate a team of that size.";

const MORALE = [
  "morale is high",
  "the crowd is on its feet",
  "a hush falls over the stadium",
  "the rope creaks ominously",
  "the coach is visibly emotional",
  "an official consults the rulebook",
];

/** Subtracts b from a by staging a tug of war between Team A (a members) and Team B (b members). */
export function tugOfWar(a: number, b: number, rng: Rng = Math.random): EngineResult {
  assertCap("a", a, 1_000, QUIP);
  assertCap("b", b, 1_000, QUIP);

  const pulls: ("A" | "B")[] = [...Array(a).fill("A"), ...Array(b).fill("B")];
  for (let i = pulls.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pulls[i], pulls[j]] = [pulls[j], pulls[i]];
  }

  let position = 0;
  const log: string[] = [];
  pulls.forEach((team, i) => {
    position += team === "A" ? 1 : -1;
    const morale = MORALE[Math.floor(rng() * MORALE.length)];
    log.push(`Round ${i + 1}: Team ${team} gains 1 metre, ${morale}. Rope at ${position} m.`);
  });

  const shown =
    log.length <= 5
      ? log
      : [...log.slice(0, 3), `… ${log.length - 5} rounds omitted for brevity …`, ...log.slice(-2)];

  const verdict =
    position > 0
      ? `Team A wins by ${position} metres.`
      : position < 0
        ? `Team B wins by ${-position} metres.`
        : "The match is a draw. The rope has not moved.";

  return {
    answer: position,
    report: [
      `Fielded Team A (${a} members) against Team B (${b} members).`,
      ...(log.length === 0 ? ["No pulls were made. Both teams stood around."] : shown),
      verdict,
      "Answer read off the rope's final position relative to the centre line.",
    ],
  };
}
