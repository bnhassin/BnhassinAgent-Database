# OpenRouter Workspace Control Center

Preview-first control center for BnhassinAgent. The static dashboard is `index.html`; it intentionally labels the snapshot and does not pretend that model analytics or agent history are live.

## Modules
- Workspace profile and connection health
- Model/provider catalogue comparison (prices and context must be fetched live)
- API key budget, account credits and consumption kept as separate measures
- Agent execution history from structured events
- Preview certification with evidence-backed gates
- Financial support statement template
- Weekly performance report definition

## Security
- Keep OpenRouter credentials in server-side environment variables / secret manager only.
- Never return secrets, authorization headers, raw prompts or private completions to this dashboard.
- Use a read-only server adapter for workspace/model/activity reads.
- Treat spend, pricing and token totals as timestamped provider observations.
- Redact prompt/response content by default. Role-based access must follow OpenRouter workspace permissions.
- The currently verified key is a free-tier API key, not a management key. Do not assume it can call management-only analytics endpoints.

## Proposed API boundary
See `api-contract.yaml`. The UI should consume normalized BnhassinAgent endpoints, not call OpenRouter with a browser-held key.

## Reusable workflows
See `workflows/weekly-performance-report.yaml` and `workflows/preview-certification.yaml`.

## Certification policy
Status is one of `NOT_READY`, `IN_PROGRESS`, `CERTIFIED_PREVIEW`, or `BLOCKED`. Every passing gate must include timestamp, environment, source, evidence URL/identifier and verifier. A production GO decision is out of scope and requires separate explicit authorization.

## Known baseline (verified 2026-11-15)
- Workspace: Default; ID: `58d7fbab-436d-5e9a-a68d-1089afed0223`
- Connector ping: pong
- Key budget: $10 limit, $10 remaining, $0 recorded usage
- Purchased account credits: $0; historical account usage: $0.03788669
- Free-model daily requests: 50 remaining at time of check
- Key type: free-tier, non-management; expiry reported 2026-11-22T19:03:01Z
- Model presets: none
- No live model comparison, agent history or preview certification evidence has been connected yet.

These are point-in-time observations, not a financial statement or guarantee of future availability.
