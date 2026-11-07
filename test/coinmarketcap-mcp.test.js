import test from "node:test";
import assert from "node:assert/strict";
import { createCmcMcpClient } from "../lib/coinmarketcap/mcp.js";

function jsonResponse(payload, headers = {}) {
  return {
    ok: true,
    status: 200,
    headers: { get: (name) => headers[name] || null },
    text: async () => JSON.stringify(payload)
  };
}

test("CMC MCP initializes and discovers tools without exposing the API key", async () => {
  const calls = [];
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    calls.push({ request, headers: options.headers });
    if (request.method === "initialize") {
      return jsonResponse({ jsonrpc: "2.0", id: request.id, result: {
        protocolVersion: "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "CMC test", version: "1" }
      }}, { "Mcp-Session-Id": "session-test" });
    }
    if (request.method === "notifications/initialized") {
      return { ok: true, status: 202, headers: { get: () => null }, text: async () => "" };
    }
    if (request.method === "tools/list") {
      return jsonResponse({ jsonrpc: "2.0", id: request.id, result: {
        tools: [{ name: "cryptocurrency_listings", description: "List market assets", inputSchema: { type: "object" } }]
      }});
    }
    throw new Error("Unexpected method");
  };

  const result = await createCmcMcpClient({ apiKey: "test-secret", fetchImpl }).listTools();
  assert.equal(result.tools[0].name, "cryptocurrency_listings");
  assert.equal(calls[0].headers["X-CMC-MCP-API-KEY"], "test-secret");
  assert.equal(calls[2].headers["Mcp-Session-Id"], "session-test");
  assert.equal(JSON.stringify(result).includes("test-secret"), false);
});

test("CMC MCP refuses to initialize without an API key", () => {
  assert.throws(() => createCmcMcpClient({ apiKey: "" }), /CMC_MCP_API_KEY/);
});

test("CMC MCP rejects a mismatched JSON-RPC response ID", async () => {
  const fetchImpl = async (_url, options) => {
    const request = JSON.parse(options.body);
    return jsonResponse({ jsonrpc: "2.0", id: request.id + 1, result: {
      protocolVersion: "2025-03-26"
    }});
  };
  const client = createCmcMcpClient({ apiKey: "test-secret", fetchImpl });
  await assert.rejects(client.listTools(), /mismatched JSON-RPC response ID/);
});
