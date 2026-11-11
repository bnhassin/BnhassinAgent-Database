# Coinbase Wallet Dashboard — Preview Committee

## Purpose
Deliver a safe, reusable first dashboard for BnhassinAgent. This is a UI and workflow demonstration, not a live Coinbase account interface.

## Scope
- Static dashboard at `demo/coinbase-wallet/index.html`.
- Clearly labelled synthetic fixtures only.
- Read-only integration boundary for future Coinbase portfolio data.
- Profile/posts and blockchain readers remain separate adapters until their sources and permissions are verified.
- No transaction execution, wallet signing, transfers, orders, or production deployment.

## Preview committee gates

| Gate | Requirement | Current demo criterion |
|---|---|---|
| C1 — UI | Dashboard loads and is responsive | Static HTML exists |
| C2 — Data boundary | Synthetic fixtures cannot be mistaken for live balances | Visible DEMO FIXTURE warning |
| C3 — Coinbase read | Read-only connector and source provenance | Adapter integration pending |
| C4 — Profile/posts | Public profile source and pagination verified | Adapter pending |
| C5 — Security | No secrets or write methods in demo | No credentials; execution disabled |
| C6 — CI | Workflow checks demo artifact and guardrails | GitHub Actions workflow |
| C7 — Vercel Preview | Correct linked project, branch, root directory and deployment URL | Must be verified after CI |
| C8 — Production | Separate explicit authorization and certification | Out of scope / blocked |

## Proposed data contract
Every metric must carry:
- `source`: `coinbase_api`, `onchain_reader`, or `demo_fixture`
- `observed_at`: ISO-8601 timestamp
- `currency`: ISO currency code
- `environment`: `demo`, `preview`, or `production`
- `is_live`: boolean

Never persist or publish access tokens, API secrets, seed phrases, private keys, or authentication codes.

## Workflow sequence
1. Pull request or feature-branch push.
2. Validate dashboard artifact and demo safety markers.
3. Run committee policy checks.
4. Publish CI evidence as workflow summary.
5. Verify the matching Vercel Preview deployment manually or through the Vercel integration.
6. Record PASS / FAIL / BLOCKED with evidence; never infer a successful deployment from CI alone.

## Acceptance
- Demo dashboard is visibly synthetic.
- No financial write operation is exposed.
- Workflow passes on the feature branch.
- Preview URL is confirmed from Vercel for the exact branch/commit.
- No production domain or alias is changed.
