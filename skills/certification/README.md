# Certification package

This package defines the typed certification contract. It intentionally does not
pretend to execute GitHub, Vercel, MCP, database, or health checks.

## Contract

- `ControlStatus` describes one control result.
- `CertificationStatus` describes the aggregate release state.
- `Evidence` binds a result to a control ID, source URL, timestamp, redaction flag,
  and exact commit SHA.
- `CertificationSnapshot.status()` is conservative: missing evidence cannot pass,
  failures block, Preview-only evidence can never produce `GO_LIVE`, and production
  without a successful post-deploy health assertion is `DEGRADED`.

## Current limitation

This is the typed domain model only. Real check runners and evidence persistence
must be implemented separately. Do not mark a control PASS unless a real tool
returned evidence that satisfies the contract. Freshness windows, immutable
snapshot storage, signed evidence, and transcript synchronization remain follow-up
work.

Run tests from the repository root:

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```
