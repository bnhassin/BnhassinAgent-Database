# Certification persistence

Recommended tables:

- `certification_checks`
- `certification_runs`
- `certification_evidence`
- `connector_health`
- `health_checks`
- `sync_transcripts`
- `audit_events`

The database layer must store operational state and evidence, not secrets.
Use PostgreSQL migrations (Alembic or the project's selected migration
system) when integrating into BnhassinAgent-Database.
