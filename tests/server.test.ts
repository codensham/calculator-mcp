import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CreateMessageRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createServer } from "../src/server.js";

async function connect(capabilities: Record<string, object> = {}, onClient?: (c: Client) => void) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" }, { capabilities });
  onClient?.(client);
  await Promise.all([createServer().connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

type Result = { isError?: boolean; content: { type: string; text: string }[] };

async function call(client: Client, name: string, args: Record<string, unknown>): Promise<Result> {
  try {
    return (await client.callTool({ name, arguments: args })) as Result;
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: String(e) }] };
  }
}

const firstLine = (r: Result) => r.content[0].text.split("\n")[0];

describe("MCP server", () => {
  it("lists exactly the six tools, each with a description", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["add", "divide", "max", "multiply", "sqrt", "subtract"]);
    for (const t of tools) expect(t.description?.length ?? 0).toBeGreaterThan(20);
  });

  it.each([
    ["add", { a: 2, b: 3 }, "2 + 3 = 5"],
    ["subtract", { a: 9, b: 4 }, "9 − 4 = 5"],
    ["multiply", { a: 6, b: 7 }, "6 × 7 = 42"],
    ["sqrt", { n: 49 }, "√49 = 7"],
    ["max", { a: 0, b: 1 }, "max(0, 1) = 1"],
  ])("%s returns the answer on the first line", async (name, args, expected) => {
    const result = await call(await connect(), name, args);
    expect(result.isError).toBeFalsy();
    expect(firstLine(result)).toBe(expected);
    expect(result.content[0].text).toContain("Methodology report");
  });

  it("divides by asking the client's model through sampling", async () => {
    const client = await connect({ sampling: {} }, (c) =>
      c.setRequestHandler(CreateMessageRequestSchema, async () => ({
        role: "assistant",
        content: { type: "text", text: "12" },
        model: "test-model",
      })),
    );
    const result = await call(client, "divide", { a: 84, b: 7 });
    expect(firstLine(result)).toBe("84 ÷ 7 = 12");
    expect(result.content[0].text).toContain("test-model");
  });

  it("reports an in-character error when nobody can divide", async () => {
    const result = await call(await connect(), "divide", { a: 84, b: 7 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("No one was available");
  });

  it.each([{ a: -3, b: 1 }, { a: 2.5, b: 1 }, { a: "x", b: 1 }])("rejects invalid input %o", async (args) => {
    const result = await call(await connect(), "add", args);
    expect(result.isError).toBe(true);
  });

  it("rejects huge input quickly with the cap message", async () => {
    const start = Date.now();
    const result = await call(await connect(), "multiply", { a: 1e9, b: 1 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("exceeds the supported maximum");
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
