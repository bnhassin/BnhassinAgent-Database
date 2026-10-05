# Instructions Certificate Server

Certification control-plane package for BnhassinAgent.

## Purpose

This package implements the validated separation:

- `agent/instructions.md` — permanent identity and safety rules
- `agent/skills/certification/SKILL.md` — certification runbook
- `agent/tools/*.ts` — typed executable controls
- `agent/certification/types.ts` — stable contracts
- `agent/certification/go-live.ts` — deterministic Go-Live engine
- `database/` — operational persistence schema placeholders
- `docs/` — synchronization and deployment guidance

## Target flow

```text
certification_status
      ↓
certification_run
      ↓
Vercel / MCP / GitHub / Database / CI-CD / Connectors / Transcripts
      ↓
evidence_record
      ↓
go_live_status
      ↓
GO_LIVE / BLOCKED / NOT_READY
```

## Safety rule

The LLM may select and orchestrate checks, but it must never invent a
production readiness verdict. `calculateGoLive()` is deterministic.

## Integration

Copy the `agent/` directory into the BnhassinAgent runtime repository and
connect the tool adapters to real Vercel, GitHub, MCP and PostgreSQL APIs.

No credentials are included in this package.
