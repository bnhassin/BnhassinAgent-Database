# BnhassinAgent Mintlify Webhook Gateway

Isolated Vercel service for receiving signed events at `POST /webhooks/mintlify`.

## Routes

- `GET /healthz` — non-sensitive health check.
- `POST /webhooks/mintlify` — signed event receiver.

## Required environment variable

Set `MINTLIFY_WEBHOOK_SECRET` in Vercel as a Sensitive/Encrypted environment variable. Use at least 32 random bytes. Generate locally with:

```bash
openssl rand -hex 32
```

Do not commit the value or send it in chat.

## Request authentication

The sender must calculate:

```text
HMAC-SHA256(secret, unix_timestamp + "." + exact_raw_request_body)
```

Headers:

- `Content-Type: application/json`
- `X-Bnhassin-Timestamp: <10-digit Unix timestamp in seconds>`
- `X-Bnhassin-Event-Id: <unique event id>`
- `X-Bnhassin-Signature: sha256=<lowercase hex digest>`

The receiver enforces a five-minute timestamp window, a 1 MiB body limit, constant-time signature comparison, JSON validation, and an allowlist of event types.

## Event envelope

```json
{
  "event_id": "evt_unique_id",
  "type": "documentation.published",
  "created_at": "2026-11-01T12:00:00Z",
  "data": {
    "deployment_id": "optional-provider-id"
  }
}
```

Allowed types:

- `deployment.started`, `deployment.succeeded`, `deployment.failed`
- `documentation.updated`, `documentation.published`
- `feedback.created`, `feedback.updated`
- `agent.started`, `agent.completed`, `agent.failed`

## Important integration boundary

This is BnhassinAgent's receiver contract. It does not imply that Mintlify natively emits these events or signs requests with these headers. A trusted relay/adapter must translate supported Mintlify, GitHub, and agent events into this envelope and sign the exact raw body.

The initial receiver validates and acknowledges events (HTTP 202) and logs event metadata only. It does not yet persist or process event payloads. Connect a durable event sink/database before relying on it for production delivery guarantees.
