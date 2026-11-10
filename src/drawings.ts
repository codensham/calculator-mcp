/**
 * Text drawings of what each engine did. Plain characters only, so they render
 * in any MCP client, terminal or chat. Every line stays within MAX_WIDTH so it
 * doesn't wrap once formatResult indents it.
 */
export const MAX_WIDTH = 46;

const fmt = (n: number) => n.toLocaleString("en-US");
const clip = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

/** Writes labels centred on columns, skipping any that would collide with the previous one. */
function labelRow(labels: { col: number; text: string }[]): string {
  let row = "";
  for (const { col, text } of labels) {
    const start = Math.max(0, col - Math.floor((text.length - 1) / 2));
    if (row.length > 0 && start <= row.length) continue;
    row = row.padEnd(start) + text;
  }
  return row;
}

/** add: the successor chain, ● for nodes from a and ○ for nodes from b. */
export function drawChain(a: number, b: number): string[] {
  const total = a + b;
  if (total === 0) return ["0", "(no successors: nothing to count)"];

  const slots: (number | null)[] =
    total <= 7 ? Array.from({ length: total }, (_, i) => i + 1) : [1, 2, 3, null, total - 1, total];

  let chain = "0";
  const labels: { col: number; text: string }[] = [];
  for (const slot of slots) {
    if (slot === null) {
      chain += " ┄┄┄";
      continue;
    }
    chain += ` ─▶ ${slot <= a ? "●" : "○"}`;
    // In an elided chain the last two labels collide; the total is the one worth showing.
    if (total <= 7 || slot !== total - 1) labels.push({ col: chain.length - 1, text: fmt(slot) });
  }

  return [chain, labelRow(labels), `● = ${fmt(a)}   ○ = ${fmt(b)}   counted ${fmt(total)} ✓`];
}

/** subtract: the rope after the match. Team A pulls left, so a positive result sits toward A. */
export function drawRope(a: number, b: number, position: number): string[] {
  const HALF = 12;
  const scale = Math.max(1, Math.ceil(Math.abs(position) / HALF));
  const offset = -Math.round(position / scale);

  const track = Array<string>(HALF * 2 + 1).fill("═");
  track[HALF] = "╪";
  track[HALF + offset] = "●";

  const left = `A [${fmt(a)}] `;
  const line = `${left}${track.join("")} [${fmt(b)}] B`;
  const centre = left.length + HALF;
  const signed = position > 0 ? `+${fmt(position)}` : fmt(position);
  const labels =
    position === 0
      ? [{ col: centre, text: "0" }]
      : [
          { col: centre + offset, text: signed },
          { col: centre, text: "0" },
        ].sort((x, y) => x.col - y.col);

  return [line, labelRow(labels), ...(scale > 1 ? [`(1 char = ${fmt(scale)} m)`] : [])];
}

export interface DartPlot {
  a: number;
  b: number;
  side: number;
  /** A sample of the darts actually thrown, as [x, y] in box coordinates. */
  sample: [number, number][];
  darts: number;
  hitRate: number;
  estimate: number;
}

/** multiply: the bounding box, the rectangle inside it, and where the darts landed. */
export function drawDarts({ a, b, side, sample, darts, hitRate, estimate }: DartPlot): string[] {
  const W = 24;
  const H = 8;
  const clamp = (v: number, n: number, full: boolean) => (full ? n : Math.min(n - 1, Math.max(1, Math.round(v))));
  const cw = clamp((a / side) * W, W, a === side);
  const ch = clamp((b / side) * H, H, b === side);

  const grid = Array.from({ length: H }, () => Array<string>(W).fill(" "));
  for (const [x, y] of sample) {
    const col = Math.min(W - 1, Math.floor((x / side) * W));
    const row = Math.min(H - 1, Math.floor((y / side) * H));
    if (grid[row][col] !== "*") grid[row][col] = x < a && y < b ? "*" : ".";
  }

  const notes = [
    `${a}×${b} inside ${side}×${side}`,
    `${fmt(darts)} darts`,
    `${(hitRate * 100).toFixed(2)}% hit`,
    `area ≈ ${estimate.toFixed(3)}`,
    "",
    "* hit   . miss",
  ];

  const splitCols = cw < W;
  const rule = (l: string, mid: string, r: string) =>
    l + (splitCols ? "─".repeat(cw) + mid + "─".repeat(W - cw) : "─".repeat(W)) + r;
  const body = (cells: string[]) =>
    "│" + (splitCols ? cells.slice(0, cw).join("") + "│" + cells.slice(cw).join("") : cells.join("")) + "│";

  const rows: string[] = [rule("┌", "┬", "┐")];
  grid.forEach((cells, i) => {
    if (i === ch) rows.push(rule("├", "┼", "┤"));
    rows.push(body(cells));
  });
  rows.push(rule("└", "┴", "┘"));

  return rows.map((row, i) => {
    const note = notes[i - 1];
    return note ? `${row}  ${note}` : row;
  });
}

/** divide: the problem travelling through the server, which does nothing to it. */
export function drawHandoff(expression: string, answer: number | string, who: string): string[] {
  return [
    clip(expression, MAX_WIDTH),
    "  ▼",
    "[ calc-mcp ]   0 operations performed",
    "  ▼",
    clip(`${clip(who, 20).padEnd(20)} did the actual maths`, MAX_WIDTH),
    "  ▼",
    clip(String(answer), MAX_WIDTH),
  ];
}

/** max: two timers, bar length proportional to how long each slept. */
export function drawTimers(a: number, b: number): string[] {
  const W = 16;
  const longest = Math.max(a, b, 1);
  const pad = String(Math.max(a, b)).length;
  return [a, b].map((v) => {
    const filled = Math.round((v / longest) * W);
    const tag = a === b ? "  ← tie" : v === Math.max(a, b) ? "  ← last = max" : "";
    return `${String(v).padStart(pad)}s ▕${"█".repeat(filled)}${"░".repeat(W - filled)}▏ woke ${v}s${tag}`;
  });
}

export interface GuessLog {
  firstWrong: number[];
  lastWrong: number[];
  wrongCount: number;
  winner: number;
}

/** sqrt: the wrong guesses (abbreviated) and the one that finally worked. */
export function drawGuesses(n: number, { firstWrong, lastWrong, wrongCount, winner }: GuessLog): string[] {
  const width = String(n).length;
  const sqWidth = String(n * n).length;
  const line = (g: number, mark: string) => `${String(g).padStart(width)}² = ${String(g * g).padEnd(sqWidth)}  ${mark}`;

  const hidden = wrongCount - firstWrong.length - lastWrong.length;
  const remainder = n - winner * winner;
  return [
    ...firstWrong.map((g) => line(g, "✗")),
    ...(hidden > 0 ? [`… ${fmt(hidden)} more wrong guesses …`] : []),
    ...lastWrong.map((g) => line(g, "✗")),
    line(winner, "✓") + (remainder > 0 ? `  (${fmt(remainder)} left over)` : ""),
  ];
}
