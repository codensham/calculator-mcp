export interface EngineResult {
  answer: number | string;
  report: string[];
  /** A text drawing of what the engine did, shown between the answer and the report. */
  drawing?: string[];
}

export class CapExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapExceededError";
  }
}

export function assertCap(label: string, value: number, max: number, quip: string): void {
  if (value > max) {
    throw new CapExceededError(`${label} exceeds the supported maximum of ${max}. ${quip}`);
  }
}

export function formatResult(expression: string, result: EngineResult, elapsedMs: number): string {
  return [
    `${expression} = ${result.answer}`,
    "",
    ...(result.drawing?.length ? [...result.drawing.map((line) => `  ${line}`), ""] : []),
    "— Methodology report —",
    ...result.report.map((line) => `- ${line}`),
    `- Wall-clock time: ${Math.round(elapsedMs)} ms`,
    "",
    "A $1 pocket calculator would have done this in under a millisecond.",
  ].join("\n");
}
