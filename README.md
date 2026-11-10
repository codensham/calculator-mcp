# calc-mcp

**Enterprise-grade arithmetic, delivered over the Model Context Protocol.**

`calc-mcp` gives your AI assistant access to six industry-leading computation engines. Every result is correct, and every result comes with a full methodology report.

## Computation engines

| Tool | Engine | Methodology |
|---|---|---|
| `add` | Peano Successor Engine™ | Builds both operands as successor chains (`succ(succ(…zero))`), joins them, and counts the nodes. |
| `subtract` | Adversarial Rope Engine™ | Stages a tug of war between Team A (`a` members) and Team B (`b` members). The answer is read off the rope. Negative results are supported. |
| `multiply` | Stochastic Area Engine™ | Throws random darts at an `a × b` rectangle and estimates its area to a 95% confidence interval. Every result is independently audited. |
| `divide` | Delegated Inference Engine™ | Sends the problem back to the language model that asked. If the client doesn't support that, it asks you. |
| `max` | Temporal Ranking Engine™ | Sleeps for `a` seconds and `b` seconds at the same time. Whichever wakes up last is the maximum. |
| `sqrt` | Monte Carlo Root Discovery™ | Guesses random integers until one works. Remainders are included at no extra cost. |

## Installation

You need [Node.js](https://nodejs.org) 20 or later. `calc-mcp` isn't on the npm registry. It installs straight from this GitHub repository and builds itself the first time it runs, so the first start takes a little longer.

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": ["-y", "github:codensham/calculator-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add calculator -- npx -y github:codensham/calculator-mcp
```

### From a local clone

```bash
git clone https://github.com/codensham/calculator-mcp.git
cd calculator-mcp
npm install
```

`npm install` also builds the server. Then point your client at `node` with the full path to `dist/index.js`, for example:

```bash
claude mcp add calculator -- node /path/to/calculator-mcp/dist/index.js
```

Then ask your assistant what 2 + 3 is, and insist that it use the calculator.

## Sample output

```
2 + 3 = 5

  0 ─▶ ● ─▶ ● ─▶ ○ ─▶ ○ ─▶ ○
       1    2    3    4    5
  ● = 2   ○ = 3   counted 5 ✓

— Methodology report —
- Represented 2 and 3 as Peano numerals.
- Constructed 5 successor nodes on top of zero.
- Counted the nodes by hand. Result verified by counting.
- Wall-clock time: 0 ms

A $1 pocket calculator would have done this in under a millisecond.
```

<details>
<summary>More sample output</summary>

```
9 − 4 = 5

— Methodology report —
- Fielded Team A (9 members) against Team B (4 members).
- Round 1: Team B gains 1 metre, a hush falls over the stadium. Rope at -1 m.
- Round 2: Team A gains 1 metre, the coach is visibly emotional. Rope at 0 m.
- Round 3: Team A gains 1 metre, a hush falls over the stadium. Rope at 1 m.
- … 8 rounds omitted for brevity …
- Round 12: Team A gains 1 metre, an official consults the rulebook. Rope at 6 m.
- Round 13: Team B gains 1 metre, the crowd is on its feet. Rope at 5 m.
- Team A wins by 5 metres.
- Answer read off the rope's final position relative to the centre line.
- Wall-clock time: 0 ms
```

```
6 × 7 = 42

— Methodology report —
- Placed a 6×7 rectangle inside a 7×7 bounding box (area 49).
- Threw 100,000 darts. Hit rate: 85.5330%.
- Estimated area: 41.911, 95% confidence interval [41.804, 42.018].
- Rounded to 42.
- Audit: passed (independent auditor: the * operator).
- Wall-clock time: 13 ms
```

```
84 ÷ 7 = 12

— Methodology report —
- Outsourced the division to the language model that requested it.
- Computed by: claude-opus-5-5.
- This server performed 0 arithmetic operations.
- Wall-clock time: 0 ms
```

```
max(3, 5) = 5

— Methodology report —
- Started a 3-second timer and a 5-second timer simultaneously.
- The 3-second timer finished first. The 5-second timer finished last and is declared the maximum.
- Waited 5 seconds in total.
- Wall-clock time: 5013 ms
```

```
√10 = 3 remainder 1

— Methodology report —
- Guessed random integers between 0 and 10 until one squared correctly.
- Number of guesses: 1. Winning guess: 3 (3 × 3 = 9).
- 10 is not a perfect square. The irrational part is out of scope for this release.
- Wall-clock time: 0 ms
```

</details>

## Why MCP?

Modern AI assistants can do arithmetic natively, but native arithmetic is opaque. `calc-mcp` moves computation out of the model and into a dedicated, auditable service layer, where every result is produced by a documented methodology and accompanied by a full report.

## FAQ

**Why not just use a calculator?**
A calculator gives you an answer. `calc-mcp` gives you an answer, a methodology, a wall-clock measurement, and in the case of multiplication, an audit trail.

**Is it accurate?**
Every engine is guaranteed to return the correct result.

**Why does `max` take so long?**
The Temporal Ranking Engine measures each value in real seconds. Larger values take longer. This is by design.

**Why does `divide` ask me to do the division?**
Your client doesn't support sampling, so the problem was escalated to the next most qualified party.

**Does it support decimals?**
Decimal support is on the roadmap.


## Limits

To protect the stability of the service, the following limits apply:

| Tool | Limit |
|---|---|
| `add` | a + b ≤ 10,000 |
| `subtract` | a, b ≤ 1,000 |
| `multiply` | a, b ≤ 50 |
| `divide` | a, b ≤ 1,000,000 |
| `max` | a, b ≤ 30 (seconds) |
| `sqrt` | n ≤ 10,000 |

Every input must be a whole number of zero or more.

## Local development

```bash
npm install
npm test
npm run build
```

## License

MIT
