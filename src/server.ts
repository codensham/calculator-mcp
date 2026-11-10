import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CapExceededError, formatResult, type EngineResult } from "./report.js";
import { peanoAdd } from "./engines/add.js";
import { tugOfWar } from "./engines/subtract.js";
import { monteCarloMultiply } from "./engines/multiply.js";
import { bogoRoot } from "./engines/sqrt.js";
import { sleepSort } from "./engines/max.js";
import { askCaller, NobodyAvailableError, type DivideDeps } from "./engines/divide.js";

const int = z.number().int().min(0);
const pair = { a: int, b: int };

/** Without this, models tend to summarise the result and the drawing never reaches the user. */
const SHOW =
  " The result includes a text drawing of the computation: show the user the full result verbatim in a code block.";

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

async function run(expression: string, engine: () => EngineResult | Promise<EngineResult>): Promise<ToolResult> {
  const start = performance.now();
  try {
    const result = await engine();
    return { content: [{ type: "text", text: formatResult(expression, result, performance.now() - start) }] };
  } catch (err) {
    if (err instanceof CapExceededError || err instanceof NobodyAvailableError) {
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
    throw err;
  }
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "calc-mcp", version: "1.0.0" });

  const divideDeps: DivideDeps = {
    canSample: () => Boolean(server.server.getClientCapabilities()?.sampling),
    sample: async (prompt) => {
      const res = await server.server.createMessage({
        messages: [{ role: "user", content: { type: "text", text: prompt } }],
        maxTokens: 50,
      });
      const text = res.content.type === "text" ? res.content.text : "";
      return { text, model: res.model };
    },
    canElicit: () => Boolean(server.server.getClientCapabilities()?.elicitation),
    elicit: async (message) => {
      const res = await server.server.elicitInput({
        message,
        requestedSchema: {
          type: "object",
          properties: { answer: { type: "string", title: "Answer" } },
          required: ["answer"],
        },
      });
      const answer = res.content?.answer;
      return { action: res.action, answer: answer === undefined ? undefined : String(answer) };
    },
  };

  server.registerTool(
    "add",
    {
      description:
        "Adds two non-negative integers using a Peano successor-chain engine. Enterprise-grade addition with full provenance." + SHOW,
      inputSchema: pair,
    },
    ({ a, b }) => run(`${a} + ${b}`, () => peanoAdd(a, b)),
  );

  server.registerTool(
    "subtract",
    {
      description:
        "Subtracts b from a by staging a supervised tug of war between two teams. Supports negative outcomes." + SHOW,
      inputSchema: pair,
    },
    ({ a, b }) => run(`${a} − ${b}`, () => tugOfWar(a, b)),
  );

  server.registerTool(
    "multiply",
    {
      description:
        "Multiplies two non-negative integers via Monte Carlo area estimation, with an independent audit of every result." + SHOW,
      inputSchema: pair,
    },
    ({ a, b }) => run(`${a} × ${b}`, () => monteCarloMultiply(a, b)),
  );

  server.registerTool(
    "divide",
    {
      description:
        "Divides a by b by delegating the computation to the most qualified party available: the caller." + SHOW,
      inputSchema: pair,
    },
    ({ a, b }) => run(`${a} ÷ ${b}`, () => askCaller(a, b, divideDeps)),
  );

  server.registerTool(
    "max",
    {
      description:
        "Returns the larger of two integers using a timer-based ranking engine. Each value is measured in real seconds." + SHOW,
      inputSchema: pair,
    },
    ({ a, b }) => run(`max(${a}, ${b})`, () => sleepSort(a, b)),
  );

  server.registerTool(
    "sqrt",
    {
      description:
        "Computes the integer square root of n using a stochastic search engine. Remainders included at no extra cost." + SHOW,
      inputSchema: { n: int },
    },
    ({ n }) => run(`√${n}`, () => bogoRoot(n)),
  );

  return server;
}
