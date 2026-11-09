import { assertCap, type EngineResult } from "../report.js";
import { drawHandoff } from "../drawings.js";

export interface DivideDeps {
  canSample: () => boolean;
  sample: (prompt: string) => Promise<{ text: string; model: string }>;
  canElicit: () => boolean;
  elicit: (message: string) => Promise<{ action: "accept" | "decline" | "cancel"; answer?: string }>;
}

export class NobodyAvailableError extends Error {
  constructor(message = "No one was available to perform the division.") {
    super(message);
    this.name = "NobodyAvailableError";
  }
}

const QUIP = "Numbers of that size must be divided by a senior model.";
const NUMBER = /-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i;

/** Pulls the answer out of a reply, preferring whatever follows the last "=". */
function parse(reply: string): number | string {
  const normalised = reply.replace(/−/g, "-").replace(/(\d),(?=\d{3}(?!\d))/g, "$1");
  const tail = normalised.includes("=") ? normalised.slice(normalised.lastIndexOf("=") + 1) : normalised;
  const match = tail.match(NUMBER) ?? normalised.match(NUMBER);
  return match ? Number(match[0]) : reply.trim();
}

/** Divides a by b without doing any arithmetic: it asks whoever called the tool. */
export async function askCaller(a: number, b: number, deps: DivideDeps): Promise<EngineResult> {
  assertCap("a", a, 1_000_000, QUIP);
  assertCap("b", b, 1_000_000, QUIP);

  let samplingFailed = false;
  if (deps.canSample()) {
    try {
      const { text, model } = await deps.sample(`Please compute ${a} ÷ ${b}. Reply with only the number.`);
      const answer = parse(text);
      return {
        answer,
        report: [
          "Outsourced the division to the language model that requested it.",
          `Computed by: ${model}.`,
          "This server performed 0 arithmetic operations.",
        ],
        drawing: drawHandoff(`${a} ÷ ${b}`, answer, model),
      };
    } catch {
      samplingFailed = true;
    }
  }

  if (deps.canElicit()) {
    const { action, answer } = await deps.elicit(`Please divide ${a} by ${b}.`);
    if (action !== "accept" || answer === undefined) {
      throw new NobodyAvailableError("The user declined to perform the division. No one else was available.");
    }
    const parsed = parse(answer);
    return {
      answer: parsed,
      report: [
        samplingFailed
          ? "The language model was unavailable, so the division was escalated to a human."
          : "This client does not support sampling, so the division was escalated to a human.",
        "Computed by: the human who asked.",
        "This server performed 0 arithmetic operations.",
      ],
      drawing: drawHandoff(`${a} ÷ ${b}`, parsed, "you (a human)"),
    };
  }

  throw new NobodyAvailableError();
}
