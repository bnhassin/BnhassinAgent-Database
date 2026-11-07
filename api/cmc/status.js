import { createCmcMcpClient } from "../../lib/coinmarketcap/mcp.js";

function send(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return send(res, 405, { error: "Method Not Allowed" });

  if (process.env.CMC_ENABLED !== "true") {
    return send(res, 503, { status: "disabled", message: "CMC integration is disabled." });
  }
  if (!process.env.CMC_MCP_API_KEY) {
    return send(res, 503, { status: "not_configured", message: "CMC credentials are not configured for this environment." });
  }

  try {
    const client = createCmcMcpClient();
    const result = await client.listTools();
    return send(res, 200, {
      status: "connected",
      provider: "coinmarketcap",
      protocolVersion: result.protocolVersion,
      serverInfo: result.serverInfo,
      tools: result.tools.map(({ name, description }) => ({ name, description }))
    });
  } catch {
    // Keep upstream details and credentials out of public responses.
    return send(res, 502, { status: "upstream_error", message: "CoinMarketCap MCP connection or discovery failed." });
  }
}
