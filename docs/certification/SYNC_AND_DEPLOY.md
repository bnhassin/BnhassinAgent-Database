# Sync and Deploy

## Repository target

The certification layer is intended for:

`bnhassin/BnhassinAgent-Database`

## Vercel context

The current project context includes the BnhassinAgent Vercel deployment and
a separate GitHub MCP Server UI deployment. Treat Preview and Production as
different states.

## Recommended sequence

1. Create branch `feat/certification-control-plane`.
2. Copy `agent/` into the repository.
3. Add persistence migrations.
4. Add adapters for Vercel, GitHub, MCP and PostgreSQL.
5. Add unit tests for `calculateGoLive`.
6. Run CI.
7. Deploy Preview.
8. Run certification against Preview.
9. Promote to Production only after required checks pass.
10. Record the final certification snapshot.

## Secrets

Never commit:

- API keys
- OAuth tokens
- refresh tokens
- passwords
- database credentials
- private signing material

Use Vercel/GitHub secret stores and environment variables.

## Important

A Vercel `READY` deployment is evidence for one gate only. It is not a
GO_LIVE verdict.
