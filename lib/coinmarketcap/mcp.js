const DEFAULT_ENDPOINT = "https://mcp.coinmarketcap.com/mcp";
const PROTOCOL_VERSION = "2025-03-26";

function parseRpcResponse(body) {
  const trimmed = String(body || "").trim();
  if (!trimmed) throw new Error("CMC MCP returned an empty response.");
  if (trimmed.startsWith("data:") || trimmed.includes("\nevent:") || trimmed.includes("\ndata:")) {
    const data = trimmed.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).filter(Boolean);
    if (!data.length) throw new Error("CMC MCP returned an empty event stream.");
    return JSON.parse(data[data.length - 1]);
  }
  return JSON.parse(trimmed);
}

export function createCmcMcpClient({
  apiKey = process.env.CMC_MCP_API_KEY,
  endpoint = process.env.CMC_MCP_URL || DEFAULT_ENDPOINT,
  fetchImpl = globalThis.fetch,
  timeoutMs = 15000
} = {}) {
  if (!apiKey) throw new Error("CMC_MCP_API_KEY is not configured.");
  if (typeof fetchImpl !== "function") throw new Error("A Fetch API implementation is required.");

  let requestId = 0;
  let sessionId;

  async function rpc(method, params = {}) {
    const id = ++requestId;
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-CMC-MCP-API-KEY": apiKey,
      "MCP-Protocol-Version": PROTOCOL_VERSION
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;

    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      // Do not include response bodies: upstream errors may contain sensitive diagnostics.
      throw new Error(`CMC MCP request failed with HTTP ${response.status}.`);
    }
    const receivedSession = response.headers?.get?.("Mcp-Session-Id");
    if (receivedSession) sessionId = receivedSession;
    if (response.status === 202) return null;

    const payload = parseRpcResponse(await response.text());
    if (payload.error) {
      throw new Error(`CMC MCP error ${payload.error.code ?? "unknown"}: ${String(payload.error.message || "request failed").slice(0, 240)}`);
    }
    if (payload.id !== id) throw new Error("CMC MCP returned a mismatched JSON-RPC response ID.");
    return payload.result;
  }

  async function notify(method, params = {}) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-CMC-MCP-API-KEY": apiKey,
      "MCP-Protocol-Version": PROTOCOL_VERSION
    };
    if (sessionId) headers["Mcp-Session-Id"] = sessionId;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method, params }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) throw new Error(`CMC MCP notification failed with HTTP ${response.status}.`);
    const receivedSession = response.headers?.get?.("Mcp-Session-Id");
    if (receivedSession) sessionId = receivedSession;
  }

  async function initialize() {
    const result = await rpc("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: "BnhassinAgent", version: "0.1.0" }
    });
    if (!result?.protocolVersion) throw new Error("CMC MCP initialization response is invalid.");
    await notify("notifications/initialized", {});
    return result;
  }

  return {
    async listTools() {
      const initialized = await initialize();
      const result = await rpc("tools/list", {});
      if (!Array.isArray(result?.tools)) throw new Error("CMC MCP tools/list response is invalid.");
      return {
        protocolVersion: initialized.protocolVersion,
        serverInfo: initialized.serverInfo || null,
        tools: result.tools.map((tool) => ({
          name: String(tool.name || ""),
          description: String(tool.description || ""),
          inputSchema: tool.inputSchema || {}
        }))
      };
    }
  };
}
