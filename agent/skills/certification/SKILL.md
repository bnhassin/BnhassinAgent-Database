# BnhassinAgent Certification

## Purpose

Certify the operational state of BnhassinAgent before production use.

## Required domains

- AGENT
- VERCEL
- MCP_SERVER
- GITHUB
- DATABASE
- CONNECTORS
- CI_CD
- TRANSCRIPTS
- OBSERVABILITY

## Procedure

1. Read the current certification state.
2. Identify required checks for the target environment.
3. Execute the relevant typed certification tools.
4. Record evidence for every required check.
5. Recalculate the global certification state.
6. Identify blockers and warnings.
7. Never declare GO_LIVE without a valid certification snapshot.

## Check states

`NOT_TESTED` · `PENDING` · `PASS` · `WARN` · `FAIL` · `BLOCKED`

## Global states

`NOT_READY` · `CERTIFICATION_IN_PROGRESS` · `READY_FOR_GO_LIVE` ·
`GO_LIVE` · `DEGRADED` · `BLOCKED`

## Mandatory production gates

- MCP endpoint reachable
- MCP protocol handshake
- MCP authentication
- Vercel production deployment ready
- Vercel runtime health
- GitHub CI successful
- GitHub tests successful
- Database reachable
- Database migrations valid
- Database persistence verified

## Connector rule

A disabled or unauthenticated connector does not automatically block
production. Only connectors explicitly required for the target environment
are blocking.

## Evidence rule

Every PASS, FAIL or BLOCKED result must have machine-readable evidence:

- check identifier
- observed value
- expected value
- timestamp
- environment
- source
- evidence reference
- integrity hash when applicable

## Go-Live rule

GO_LIVE is allowed only when every required enabled check is PASS and the
production deployment, MCP handshake, database persistence, and certification
snapshot are valid.
