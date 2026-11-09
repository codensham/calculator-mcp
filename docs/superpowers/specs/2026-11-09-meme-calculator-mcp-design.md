# Calculator MCP — Design

Date: 2026-11-09
Status: Approved 2026-11-09

## Intent

A meme GitHub repo: an MCP server that is a calculator. Using an MCP server
for arithmetic already makes no sense; the punchline is that **every
operation computes its answer in the least logical way possible**. The LLM
calling it could do the maths itself, and the server goes to absurd lengths
anyway.

Success = people screenshot the tool output and the README and share them.

## Goals

- Six tools, each with its own absurd-but-real computation method (below).
- **Answers are always correct** (decided by the user). It is technically a
  working calculator. The random methods (`multiply`, `sqrt`) must
  guarantee a correct result, and their tests must check that.
- Every result returns the answer first, then a deadpan **methodology
  report**: what was done, how long it took, resources used (nodes built,
  darts thrown, rounds pulled, guesses made, model consulted), and a
  comparison to a $1 pocket calculator. *(Claude's call.)*
- README plays it completely straight, like a serious enterprise project.
  *(Claude's call.)*
- Trivial to install: one `npx` line in Claude Desktop / Claude Code config.

## Non-goals

- Decimals, big numbers, expression parsing, a general-purpose calculator.
- HTTP/remote transport, UI, persistence.
- Performance.

## Anti-goals (failure even if it works)

- Doing anything to the user's machine beyond CPU and timers. **No disk
  writes, no network calls of its own** (the user explicitly rejected the
  temp-file subtract idea).
- So slow or so broken that it stops being funny and becomes annoying.
- A README that winks too hard. Deadpan beats "lol random".

## Operations

All inputs are non-negative integers unless stated. Each tool enforces caps;
exceeding a cap returns a dry, in-character error rather than running.
Exact cap values are the builder's call within the guidance given.

### `add(a, b)` — Peano arithmetic
Build `a` and `b` as successor chains (`succ(succ(…zero))`), join them, then
count the nodes to get the answer. Count iteratively (no recursion-depth
crashes). Report: number of successor nodes constructed. Cap around
a + b ≤ 10,000.

### `subtract(a, b)` — Tug of war
Simulate two teams, Team A with `a` members and Team B with `b` members,
pulling a rope. Each member pulls one unit, in a random order, over rounds.
The rope's final offset from the centre line is the answer. **Negative
results are allowed** (Team B wins and the rope ends up on their side). Report:
an abbreviated round-by-round match log ("Round 3: Team A gains 1 metre,
morale is high"), so it stays readable when the numbers are large, plus
the winning team. Cap around a, b ≤ 1,000.

### `multiply(a, b)` — Monte Carlo
Place an a×b rectangle inside a known bounding box (e.g. square of side
max(a, b)). Throw random darts, estimate the rectangle's area from the hit
fraction × box area, then round. Keep throwing until the confidence interval
is tight enough that the rounded answer is reliable (e.g. 99.9% CI
half-width < 0.5). To guarantee correctness, the rounded estimate is then
checked by an "independent auditor" (the `*` operator). If the audit fails,
the whole experiment is rerun from scratch until it passes, and the report
says how many attempts were rejected. *(Claude's call: the cheat is kept,
and the report admits it.)* Report: darts thrown, hit rate, estimate
before rounding, confidence interval, audit result. Cap a, b so this completes in
a few seconds at most (around ≤ 50). Zero inputs short-circuit with a
report noting no darts were needed.

### `divide(a, b)` — Ask the caller
The server does no division. It sends an MCP **sampling** request back to
the client ("Please compute a ÷ b. Reply with only the number."), so the
model that called the tool answers its own question. Parse the number out
and return it. Report: which model answered (from the sampling result's
`model` field) and a note that the server performed zero arithmetic.

Fallback chain:
1. Client supports sampling → sampling.
2. Else client supports **elicitation** → show the user a form: "Please
   divide a by b." Return what they enter.
3. Else → error: no one was available to perform the division.

Division by zero is forwarded unchanged; whoever answers deals with it.
Non-integer results are fine here. The answer is whatever the model or
the human says. The "always correct" guarantee covers the server's own
maths, not other people's. *(Claude's call.)* Consensus voting and
recursive self-calls were discussed and dropped. *(Claude's call: keep it
simple.)*

### `max(a, b)` — Sleep sort
Start two timers, `a` seconds and `b` seconds. Whichever finishes last is
the max. A tie (both at once) is reported as a tie. Report: total
wall-clock time spent waiting. Cap around a, b ≤ 30 (real seconds; the
wait is the joke).

### `sqrt(n)` — Bogo-root
Guess random integers in [0, n] until one lands on the **integer square
root**: g² ≤ n < (g+1)². No guess limit; with the cap, the expected number
of guesses stays small. Perfect squares return exactly ("√49 = 7").
Non-perfect squares return the integer root plus a remainder, which is
exactly correct ("√10 = 3 remainder 1"), with a deadpan note that the
irrational part was "out of scope for this release". *(Claude's call.)*
Report: number of guesses. Cap around n ≤ 10,000.

## Constraints and stack (Claude's call)

- TypeScript, official `@modelcontextprotocol/sdk`, stdio transport.
- Node ≥ 20. Published to npm so it runs via `npx`.
- Uses the SDK's client-capability info to choose divide's fallback.
- Sampling support varies across MCP clients. The README should say which
  clients actually show off `divide`. Verify this during the build rather
  than assuming it.

## README

Deadpan enterprise tone: feature table of the six "computation engines",
install snippet for Claude Desktop and Claude Code, an example transcript
(ideally a screenshot) of each tool's methodology report, and a straight-
faced "Why MCP?" section. A FAQ entry like "Why not just use a calculator?"
answered with total seriousness.

## Definition of done (Claude's call)

The build ends at a **publish-ready** repo: it builds, the tests pass, and
it works locally over stdio. Creating the GitHub repo, publishing to npm,
taking real screenshots and confirming which clients support `divide` are
left to the user, with a checklist in the README or a `LAUNCH.md`. The
README's client support list stays a marked placeholder until verified.

## Left to the builder

- Package and repo name (working name: `calculator-mcp`).
- File layout, test framework, exact cap values within the guidance above.
- Exact wording of reports, errors and README copy, within the tone above.
- Tests: each method gives correct results on small inputs; `max` tested
  with fake timers; `divide` tested with a mocked client covering all three
  fallback paths.
