# CoinMarketCap MCP integration

## Scope

This integration connects the server-side BnhassinAgent runtime to the official CoinMarketCap Streamable HTTP MCP endpoint. The first milestone performs MCP initialization and tool discovery only; it does not execute market tools, place trades, or enable x402 payments.

## Preview configuration

Set these variables on the Vercel **Preview** environment only:

- `CMC_ENABLED=true`
- `CMC_PROVIDER=standard`
- `CMC_MCP_URL=https://mcp.coinmarketcap.com/mcp`
- `CMC_MCP_API_KEY` (secret; add through Vercel project settings)

Do not put the API key in Git, client-side code, build logs, or HTTP responses. Production variables must remain untouched.

## Endpoint

`GET /api/cmc/status`

The endpoint returns `connected` and the discovered tool names/descriptions after successful MCP initialization. It returns a sanitized error on failure and never returns credentials or tool schemas containing arbitrary secrets.

The endpoint is a diagnostic route. Protect it with the application's authentication/access-control layer before exposing it beyond a restricted Preview environment.

## Protocol behavior

The client sends JSON-RPC over Streamable HTTP with the CoinMarketCap API-key header, initializes the MCP session, sends the initialized notification, then calls `tools/list`. It preserves the MCP session ID between requests within the diagnostic call.

## Validation

Run:

```sh
npm test
```

Tests use a mocked Fetch implementation. A successful local test does not prove that the live CoinMarketCap credential or remote service works. Live validation requires the Preview-only secret and a request to the Preview endpoint.

## Rollout guardrails

- Standard API-key authentication only.
- x402 remains disabled.
- No production deployment or production secret changes.
- Do not add trading or transaction-execution capabilities in this integration milestone.
