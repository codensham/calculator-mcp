# Calculator MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a stdio MCP server with six calculator tools, each of which computes a correct answer by an absurd method and returns a deadpan methodology report.

**Architecture:** Each operation is a pure "engine" module in `src/engines/` that returns `{ answer, report }`, with randomness and timers injected so it can be tested. `src/server.ts` registers one MCP tool per engine, enforces input schemas, and formats output through `src/report.ts`. `divide` is the only engine that talks back to the client (sampling, then elicitation).

**Tech Stack:** TypeScript (ESM), Node ≥ 20, `@modelcontextprotocol/sdk` (latest), `zod`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-11-09-meme-calculator-mcp-design.md`

## Global Constraints

- Every answer the server itself computes is always correct. `divide` returns whatever the model or the human says.
- No disk writes and no network calls of the server's own. Only CPU, timers and MCP messages to the client.
- Inputs are non-negative integers (`z.number().int().min(0)`).
- Caps: add a + b ≤ 10,000; subtract a, b ≤ 1,000; multiply a, b ≤ 50; max a, b ≤ 30; sqrt n ≤ 10,000; divide a, b ≤ 1,000,000.
- Exceeding a cap returns an MCP tool error (`isError: true`) with dry, in-character text. It never crashes or hangs.
- Tone: deadpan, enterprise-serious. No "lol", no emoji in reports.
- The package is named `calculator-mcp` with a bin of the same name, so it runs via `npx calculator-mcp`.
- SDK API names used below (`McpServer.registerTool`, `server.server.getClientCapabilities()`, `server.server.createMessage()`, `server.server.elicitInput()`, `InMemoryTransport`) are from SDK 1.x. If the installed major version differs, use its equivalents and note this in the commit.

## Review Focus

1. **Bad input** (`-3`, `2.5`, `1e9`, a string): the call is rejected with a clear message, no crash and no long run. Test in Task 8.
2. **The user denies the sampling approval popup, or sampling throws:** `divide` falls through to elicitation if the client supports it, otherwise returns an in-character error. Test in Task 7.
3. **The model replies to divide in prose** ("The answer is 12."): the number is extracted. If there is no number, the raw reply is returned as the answer. Test in Task 7.
4. **Multiply at its worst case under the caps** (50 × 25): it finishes in a few seconds and is still correct. Test in Task 4.
5. **max at the cap (30 s) and edge values (0, ties):** it finishes inside typical client timeouts and reports ties as ties. Test in Task 6.

---

## File structure

```
package.json, tsconfig.json, .gitignore, LICENSE, README.md, LAUNCH.md
src/index.ts          stdio entry point (bin), shebang
src/server.ts         createServer(): McpServer — registers the six tools
src/report.ts         EngineResult type, CapExceededError, assertCap, formatResult
src/rng.ts            Rng type, mulberry32 seeded rng for tests
src/engines/add.ts        peanoAdd
src/engines/subtract.ts   tugOfWar
src/engines/multiply.ts   monteCarloMultiply
src/engines/sqrt.ts       bogoRoot
src/engines/max.ts        sleepSort
src/engines/divide.ts     askCaller
tests/*.test.ts       one per module, plus tests/server.test.ts
```

---

### Task 1: Scaffold and shared report helpers

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `src/report.ts`, `src/rng.ts`
- Test: `tests/report.test.ts`

**Interfaces:**
- Produces:
  - `type Rng = () => number` (values in [0, 1)); `mulberry32(seed: number): Rng`
  - `interface EngineResult { answer: number | string; report: string[] }`
  - `class CapExceededError extends Error`
  - `assertCap(label: string, value: number, max: number, quip: string): void`: throws `CapExceededError` with the message `` `${label} exceeds the supported maximum of ${max}. ${quip}` ``
  - `formatResult(expression: string, result: EngineResult, elapsedMs: number): string`

- [ ] **Step 1: Initialise the project.** Run `git init`. Write `package.json`: `"name": "calculator-mcp"`, `"type": "module"`, `"bin": {"calculator-mcp": "dist/index.js"}`, `"files": ["dist"]`, `"engines": {"node": ">=20"}`, `"license": "MIT"`, scripts `build: tsc`, `test: vitest run`, `start: node dist/index.js`. Run `npm install @modelcontextprotocol/sdk zod` and `npm install -D typescript vitest @types/node`. `tsconfig.json`: target ES2022, module/moduleResolution NodeNext, strict, rootDir `src`, outDir `dist`. `.gitignore`: `node_modules/`, `dist/`.
- [ ] **Step 2: Write the failing tests** in `tests/report.test.ts`:
  - `formatResult("2 + 3", {answer: 5, report: ["Built 5 nodes."]}, 12)`: the first line is `2 + 3 = 5`. The output contains `Methodology report`, `Built 5 nodes.`, `12 ms`, and the line `A $1 pocket calculator would have done this in under a millisecond.`
  - `assertCap("a", 51, 50, "Q.")` throws a `CapExceededError` whose message is `a exceeds the supported maximum of 50. Q.`; `assertCap("a", 50, 50, "Q.")` doesn't throw.
  - `mulberry32(1)` gives the same sequence twice, and every value is in [0, 1).
- [ ] **Step 3: Run `npx vitest run tests/report.test.ts`.** Expected: FAIL (modules missing).
- [ ] **Step 4: Implement `src/report.ts` and `src/rng.ts`.** Output layout: the `expression = answer` line, a blank line, `— Methodology report —`, the report lines as `- ` bullets, `- Wall-clock time: N ms`, then the pocket-calculator line.
- [ ] **Step 5: Run the tests.** Expected: PASS.
- [ ] **Step 6: Commit** `chore: scaffold project and report helpers`.

### Task 2: add — Peano arithmetic

**Files:** Create `src/engines/add.ts`; Test `tests/add.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`
- Produces: `peanoAdd(a: number, b: number): EngineResult`

- [ ] **Step 1: Write the failing tests:**
  - for pairs (0,0), (0,7), (3,4) and (9999,1): `answer === a + b`
  - the report contains `` `${a + b} successor nodes` ``
  - `peanoAdd(5000, 5001)` throws `CapExceededError`
  - `peanoAdd(10000, 0)` doesn't overflow the stack
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** Nodes are `{ prev: Node | null }` with `zero = { prev: null }`. Build `a` by applying `succ` a times, then apply `succ` to that chain b more times. Count by walking `prev` in a loop, never by recursion. Cap: `a + b ≤ 10,000`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add via Peano arithmetic`.

### Task 3: subtract — Tug of war

**Files:** Create `src/engines/subtract.ts`; Test `tests/subtract.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`, `Rng`
- Produces: `tugOfWar(a: number, b: number, rng?: Rng): EngineResult` (defaults to `Math.random`)

- [ ] **Step 1: Write the failing tests** (with `mulberry32(42)`):
  - for pairs (5,3), (3,5), (4,4), (0,0) and (1000,1): `answer === a - b`. Negative results are allowed.
  - (5,3): the report includes `Team A wins`
  - (3,5): the report includes `Team B wins`
  - (4,4): the report includes `draw`
  - (1000,1000): the report has at most 12 lines, so the match log is abbreviated
  - `tugOfWar(1001, 0)` throws `CapExceededError`
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** Make a list of `a` "A" pulls and `b` "B" pulls, then Fisher–Yates shuffle it with `rng`. Each pull is one round. An A pull moves the rope +1 metre and a B pull −1. The final position is the answer. The log shows the first 3 rounds, then `… N rounds omitted for brevity …`, then the last 2 rounds. Each round line has a short morale flavour line taken from a fixed array. The report then states the winner: `Team A wins by N metres`, `Team B wins by N metres`, or `The match is a draw. The rope has not moved.`
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: subtract via tug of war`.

### Task 4: multiply — Monte Carlo with audit

**Files:** Create `src/engines/multiply.ts`; Test `tests/multiply.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`, `Rng`, `mulberry32`
- Produces: `monteCarloMultiply(a: number, b: number, rng?: Rng, maxDartsPerAttempt?: number): EngineResult` (default dart limit is 30,000,000)

- [ ] **Step 1: Write the failing tests:**
  - for every pair in {0, 1, 7, 13, 50}²: `answer === a * b`
  - (0, 9): the report includes `No darts were required`
  - (7, 13): the report includes the dart count, `confidence interval`, and `Audit: passed`
  - **Audit retry:** use an rng that returns 0.999 for its first 20,000 calls (every dart misses, so the estimate is 0) and `mulberry32(7)` after that, with `maxDartsPerAttempt = 10_000`. For (3, 4) the answer is 12 and the report includes `1 attempt rejected by audit`.
  - **Worst case:** (50, 25) with `Math.random` returns 1250 in under 10 s (vitest timeout 20 s)
  - `monteCarloMultiply(51, 1)` throws `CapExceededError`
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** If either input is 0, return 0 at once with the "no darts" report. Otherwise:
  ```
  side = max(a, b); box = side²
  attempt loop:
    throw darts in batches of 100_000 (fewer if the limit is closer):
      x = rng()*side, y = rng()*side, hit if x < a && y < b
    after each batch: p = hits/n, se = box*sqrt(p(1-p)/n)
    stop when 1.96*se < 0.5 or n ≥ maxDartsPerAttempt
    estimate = p*box; rounded = Math.round(estimate)
    audit: rounded === a*b ? done : rejected++, start over with fresh counts
  ```
  When a == b, p is 1 and se is 0, so it stops after the first batch. Report: darts thrown (last attempt), hit rate, estimate to 3 decimals, `95% confidence interval [lo, hi]`, then `Audit: passed (independent auditor: the * operator)` and `N attempt(s) rejected by audit` when N > 0.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: multiply via Monte Carlo with audit`.

### Task 5: sqrt — Bogo-root

**Files:** Create `src/engines/sqrt.ts`; Test `tests/sqrt.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`, `Rng`
- Produces: `bogoRoot(n: number, rng?: Rng): EngineResult`

- [ ] **Step 1: Write the failing tests** (with `mulberry32(3)`):
  - n = 0 → `0`; 1 → `1`; 49 → `7`; 10000 → `100`. For perfect squares the answer is a number.
  - n = 10 → `"3 remainder 1"`; 2 → `"1 remainder 1"`; 9999 → `"99 remainder 198"`
  - for every n in 0..500: `g² ≤ n < (g+1)²` and the remainder equals `n − g²`, where g is parsed from the answer
  - the report includes `guesses`
  - non-perfect squares include `out of scope for this release`
  - `bogoRoot(10001)` throws `CapExceededError`
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** Loop: `g = Math.floor(rng() * (n + 1))`, count the guess, and stop when `g*g ≤ n && (g+1)*(g+1) > n`. There is no guess limit.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: sqrt via bogo-root`.

### Task 6: max — Sleep sort

**Files:** Create `src/engines/max.ts`; Test `tests/max.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`
- Produces: `sleepSort(a: number, b: number): Promise<EngineResult>`

- [ ] **Step 1: Write the failing tests** with `vi.useFakeTimers()`. Start the promise, call `await vi.advanceTimersByTimeAsync(31_000)`, then await the promise.
  - (3, 7) → 7; (7, 3) → 7; (0, 0) → 0; (30, 29) → 30
  - (4, 4): the report includes `tie`
  - (3, 7): the report includes `7 seconds`
  - the promise has not settled after advancing 6,999 ms for (3, 7)
  - `sleepSort(31, 0)` rejects with `CapExceededError`
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** Start two `setTimeout`s, one at `a*1000` ms and one at `b*1000` ms. Each records `{value, finishedAt: Date.now()}` in finish order. Resolve once both have finished. The value of the last one to finish is the max. If both `finishedAt` are equal, it's a tie. Report: `Waited N seconds`. On a tie, also say both timers finished simultaneously.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: max via sleep sort`.

### Task 7: divide — Ask the caller

**Files:** Create `src/engines/divide.ts`; Test `tests/divide.test.ts`

**Interfaces:**
- Consumes: `EngineResult`, `assertCap`
- Produces:
  ```ts
  interface DivideDeps {
    canSample: () => boolean;
    sample: (prompt: string) => Promise<{ text: string; model: string }>;
    canElicit: () => boolean;
    elicit: (message: string) => Promise<{ action: "accept" | "decline" | "cancel"; answer?: string }>;
  }
  class NobodyAvailableError extends Error {}
  askCaller(a: number, b: number, deps: DivideDeps): Promise<EngineResult>
  ```

- [ ] **Step 1: Write the failing tests**, using fake `DivideDeps`:
  - sampling replies `"12"` with model `"m1"` → answer 12. The report includes `m1` and `0 arithmetic operations`. The prompt passed to `sample` is exactly `Please compute 84 ÷ 7. Reply with only the number.`
  - a sampling reply of `"The answer is 12.5."` → 12.5
  - a sampling reply of `"undefined, obviously"` → the answer is that raw string
  - (5, 0) is forwarded to `sample` unchanged
  - `canSample` false and `canElicit` true, with elicit accepting `"12"` → 12. The elicit message is `Please divide 84 by 7.` The report mentions a human.
  - **The sampling call throws** (approval denied) and `canElicit` is true → falls back to elicitation
  - the sampling call throws and `canElicit` is false → rejects with `NobodyAvailableError`
  - elicit returns `decline` → rejects with `NobodyAvailableError`, and the message mentions the user declined
  - neither capability → rejects with `NobodyAvailableError("No one was available to perform the division.")`
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** Number extraction uses the first match of `/-?\d+(?:\.\d+)?(?:e-?\d+)?/i`. If nothing matches, the answer is the trimmed raw reply. Cap: a, b ≤ 1,000,000.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: divide by asking the caller`.

### Task 8: MCP server wiring and entry point

**Files:** Create `src/server.ts`, `src/index.ts`; Test `tests/server.test.ts`

**Interfaces:**
- Consumes: all engines, `formatResult`, `CapExceededError`, `NobodyAvailableError`
- Produces: `createServer(): McpServer`. Tools: `add`, `subtract`, `multiply` and `divide` take `{a, b}`, `max` takes `{a, b}`, `sqrt` takes `{n}`.

- [ ] **Step 1: Write the failing tests.** Connect an SDK `Client` to `createServer()` with `InMemoryTransport.createLinkedPair()`.
  - `listTools` returns exactly the six names, and each has a deadpan, enterprise-style description
  - `add {a:2,b:3}`: the text's first line is `2 + 3 = 5`
  - `subtract`, `multiply` and `sqrt` give correct first lines (`9 − 4 = 5`, `6 × 7 = 42`, `√49 = 7`)
  - `max {a:0,b:1}`: the first line is `max(0, 1) = 1` (real timers, 1 s)
  - the client declares `sampling` and its `CreateMessageRequestSchema` handler returns text `"12"`, model `"test-model"` → `divide {a:84,b:7}` gives first line `84 ÷ 7 = 12` and mentions `test-model`
  - a client with no sampling or elicitation → `divide` returns `isError: true` with the "No one was available" text
  - **Bad input:** `add {a:-3,b:1}`, `add {a:2.5,b:1}` and `add {a:"x",b:1}` each produce an error result or a rejected call, never a success. `multiply {a:1e9,b:1}` returns `isError: true` and the cap message within 1 s.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement `createServer()`.** Register each tool with `registerTool`, using a zod input schema of `z.number().int().min(0)` per field. Time the engine call and return `{content:[{type:"text", text: formatResult(expr, result, ms)}]}`. Catch `CapExceededError` and `NobodyAvailableError` and return `{isError: true, content:[{type:"text", text: err.message}]}`. Build `DivideDeps` from `server.server.getClientCapabilities()` (`sampling` / `elicitation` present), `server.server.createMessage({messages:[{role:"user", content:{type:"text", text: prompt}}], maxTokens: 50})`, and `server.server.elicitInput({message, requestedSchema:{type:"object", properties:{answer:{type:"string", title:"Answer"}}, required:["answer"]}})`.
- [ ] **Step 4: Implement `src/index.ts`.** Start with the shebang `#!/usr/bin/env node`, then `createServer().connect(new StdioServerTransport())`. Nothing may be logged to stdout.
- [ ] **Step 5: Run `npm test` and `npm run build`.** Expected: all tests pass, and `dist/index.js` exists.
- [ ] **Step 6: Smoke test.** Run `npx @modelcontextprotocol/inspector node dist/index.js --cli --method tools/list`. Expected: the six tools are listed. If the inspector CLI isn't available offline, skip this step and say so.
- [ ] **Step 7: Commit** `feat: wire MCP server and stdio entry point`.

### Task 9: README, LAUNCH checklist, licence

**Files:** Create `README.md`, `LAUNCH.md`, `LICENSE` (MIT, holder left as `<YOUR NAME>`)

- [ ] **Step 1: Write `README.md` in a deadpan enterprise tone:**
  - the title and a one-line serious tagline
  - a "Computation Engines" table with all six tools and their methods
  - an install snippet for Claude Desktop (`claude_desktop_config.json` with `"command": "npx", "args": ["-y", "calculator-mcp"]`) and Claude Code (`claude mcp add calculator -- npx -y calculator-mcp`)
  - one real example output per tool, captured by calling the engines from a scratch script
  - a straight-faced "Why MCP?" section
  - a FAQ that includes "Why not just use a calculator?"
  - "Client support for `divide`", marked `<!-- TODO: verify -->`
  - limits (the caps), local development (`npm install`, `npm test`, `npm run build`), and a licence line
- [ ] **Step 2: Write `LAUNCH.md`** as a checklist for the user:
  - create the GitHub repo and push
  - check that the `calculator-mcp` npm name is free, or rename it in `package.json` and the README
  - `npm publish`
  - add the server to Claude Desktop and Claude Code and try each tool
  - find out which clients support sampling and elicitation, then fill in the README's client table
  - take screenshots for the README
- [ ] **Step 3: Verify.** `npm test` passes. Every example output in the README matches the formats the tests pin. The README's install commands use the bin name from `package.json`.
- [ ] **Step 4: Commit** `docs: README, launch checklist, licence`.
