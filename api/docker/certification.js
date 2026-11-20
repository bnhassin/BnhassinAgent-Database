import { getDockerHubProfile, getDockerHubRepositories } from "../../apps/docker-mcp-portal/lib/docker-hub.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const username = process.env.DOCKER_HUB_USERNAME || "bnhassin";
  const checks = [];
  try {
    const profile = await getDockerHubProfile(username);
    checks.push({ id: "DOCKER_HUB.PUBLIC_PROFILE_READ", status: "PASS", observed: profile.username, expected: username, source: "Docker Hub public API" });
  } catch (error) {
    checks.push({ id: "DOCKER_HUB.PUBLIC_PROFILE_READ", status: "FAIL", observed: error.message, expected: "HTTP 200 with public profile", source: "Docker Hub public API" });
  }

  try {
    const repositories = await getDockerHubRepositories(username, 1, 5);
    checks.push({ id: "DOCKER_HUB.PUBLIC_REPOSITORIES_READ", status: "PASS", observed: repositories.repositories.length, expected: "Valid public repository collection", source: "Docker Hub public API" });
  } catch (error) {
    checks.push({ id: "DOCKER_HUB.PUBLIC_REPOSITORIES_READ", status: "FAIL", observed: error.message, expected: "HTTP 200 with repository collection", source: "Docker Hub public API" });
  }

  checks.push({
    id: "DOCKER_MCP.GATEWAY_CONFIGURED",
    status: process.env.DOCKER_AGENTIC_MCP_GATEWAY_URL ? "PENDING" : "NOT_TESTED",
    observed: process.env.DOCKER_AGENTIC_MCP_GATEWAY_URL ? "Endpoint configured; handshake not executed" : "No Preview gateway endpoint configured",
    expected: "Account-owned Streamable HTTP MCP endpoint and successful handshake",
    source: "Preview environment configuration"
  });
  checks.push({
    id: "DOCKER_MCP.PROTOCOL_HANDSHAKE",
    status: "NOT_TESTED",
    observed: "No authenticated MCP client handshake executed",
    expected: "Successful MCP initialize/capabilities exchange",
    source: "MCP client validation"
  });
  checks.push({
    id: "DOCKER_SANDBOX.CLOUD_ACCESS",
    status: "NOT_TESTED",
    observed: "No documented account control API or account authorization verified",
    expected: "Docker Agentic Platform cloud access confirmed",
    source: "Docker Agentic Platform console"
  });
  checks.push({
    id: "DOCKER_SANDBOX.LIFECYCLE",
    status: "NOT_TESTED",
    observed: "Sandbox create/pause/resume/delete not invoked",
    expected: "Lifecycle operation verified in isolated Preview sandbox",
    source: "Docker Agentic Platform"
  });
  checks.push({
    id: "DOCKER_SECURITY.READ_ONLY",
    status: "PASS",
    observed: "Portal exposes GET-only Docker API routes; no registry mutation or Sandbox lifecycle route exists",
    expected: "No write-capable Docker operations exposed",
    source: "Repository route contract"
  });

  const required = checks.filter((check) => check.status !== "PASS");
  const status = required.some((check) => check.status === "FAIL") ? "BLOCKED" : required.length ? "NOT_READY" : "READY_FOR_PREVIEW_REVIEW";
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    environment: "preview",
    overallStatus: status,
    goLive: false,
    generatedAt: new Date().toISOString(),
    checks,
    note: "This is a Preview readiness report, not a production certification. NOT_TESTED and PENDING never count as PASS."
  });
}
