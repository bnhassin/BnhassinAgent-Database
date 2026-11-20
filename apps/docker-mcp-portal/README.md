# Docker MCP Control Center

Isolated, read-only Docker integration portal for BnhassinAgent.

## Scope

- Read public Docker Hub profile and public repository metadata for `bnhassin`.
- Display Docker MCP Gateway connection configuration state without exposing its URL.
- Track Docker Agentic Platform Sandbox readiness without inventing undocumented control-plane APIs.
- Provide a Preview-only certification checklist and read-only API contracts.

## Runtime

The portal is a static page at `/apps/docker-mcp-portal/`. Vercel serverless read endpoints:

- `GET /api/docker/profile`
- `GET /api/docker/repositories?page=1&page_size=25`
- `GET /api/docker/certification`

All other HTTP methods are rejected. Docker Hub requests are sent server-side to the fixed `hub.docker.com` origin. User input cannot select an upstream host.

## Configuration

- `DOCKER_HUB_USERNAME`: optional; defaults to `bnhassin`.
- `DOCKER_AGENTIC_MCP_GATEWAY_URL`: optional Preview environment variable. Only its presence is reported; its value is never returned to clients or logs.

A Docker Hub PAT is deliberately not required for public profile/repository reads. Do not add write scopes or registry mutation routes.

## Docker MCP / Sandbox integration boundary

Docker MCP Toolkit provides local profile-based MCP server management and a Gateway for connected clients. Docker Agentic Platform documents adding remote MCP servers by Streamable HTTP URL and exposes an MCP Gateway endpoint in its console. The cloud platform is experimental; sandbox network policies are separate from MCP server connections.

This repository does not assume a public Sandbox lifecycle API. Sandbox creation, pause, resume, deletion, secret provisioning, and network-policy mutation remain unavailable from this portal until Docker documents and enables a supported API for the account. The portal therefore reports these capabilities as `NOT_TESTED`, not as operational.

## Local MCP client example

For a locally installed Docker MCP Toolkit profile, connect a compatible client through:

```bash
docker mcp gateway run --profile bnhassin-preview
```

Do not commit generated client-specific MCP configuration or credentials. The Docker Agentic Platform remote MCP Gateway URL is account-specific and must be copied from its console into the Preview environment configuration by the account owner.

## Validation

From this directory:

```bash
npm test
```

The tests use Node's built-in test runner and require no additional package installation.
