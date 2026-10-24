# Kernel MCP test deployment

## Purpose

This file marks a safe, documentation-only test commit to verify the GitHub-to-Vercel Preview path for the BnhassinAgent-Database repository before adding runtime Kernel MCP integration.

## Scope

- Target: Vercel Preview only.
- Branch: `test/kernel-mcp-integration`.
- Kernel service: use the authenticated Kernel MCP connection for manual smoke tests; this commit does not embed credentials or invoke Kernel from the deployed application.
- Production: explicitly out of scope.

## Smoke-test checklist

1. Confirm the commit is visible on the test branch.
2. Confirm Vercel creates a Preview deployment for this branch.
3. Confirm the Preview URL loads and remains protected according to project policy.
4. In the authorized Kernel MCP client, verify that a test browser session can be created, navigate to the Preview URL, and be closed.
5. Record the deployment URL, commit SHA, build result, and any access-control failures in the pull request or deployment notes.
6. Do not add API keys, OAuth tokens, cookies, or session exports to this repository.

## Acceptance criteria

- The Preview deployment reaches `READY`.
- No Production deployment or domain alias is changed.
- No secrets are committed.
- Kernel browser access is tested separately from the Vercel build; a successful build alone does not certify Kernel connectivity.

## Rollback

Close the test browser session and stop using the Preview URL. The branch can be deleted after review; no production rollback is needed because this commit does not target Production.
