const DOCKER_HUB_ORIGIN = "https://hub.docker.com";

export function validateDockerHubUsername(value) {
  const username = String(value ?? "").trim();
  if (!/^[a-z0-9][a-z0-9_-]{0,29}$/i.test(username)) {
    throw new TypeError("Invalid Docker Hub username.");
  }
  return username;
}

export function normalizeDockerHubProfile(profile, requestedUsername) {
  if (!profile || typeof profile !== "object") {
    throw new TypeError("Docker Hub returned an invalid profile.");
  }
  return {
    username: String(profile.username ?? requestedUsername),
    fullName: String(profile.full_name ?? ""),
    location: String(profile.location ?? ""),
    company: String(profile.company ?? ""),
    dateJoined: profile.date_joined ?? null,
    profileUrl: `https://hub.docker.com/u/${encodeURIComponent(requestedUsername)}/`,
  };
}

export function normalizeDockerHubRepositories(payload) {
  if (!payload || !Array.isArray(payload.results)) {
    throw new TypeError("Docker Hub returned an invalid repository collection.");
  }
  return {
    count: Number.isFinite(payload.count) ? payload.count : payload.results.length,
    next: typeof payload.next === "string" ? payload.next : null,
    repositories: payload.results.map((item) => ({
      name: String(item.name ?? ""),
      namespace: String(item.namespace ?? ""),
      description: String(item.description ?? ""),
      isPrivate: Boolean(item.is_private),
      pullCount: Number(item.pull_count ?? 0),
      starCount: Number(item.star_count ?? 0),
      lastUpdated: item.last_updated ?? null
    }))
  };
}

export async function dockerHubGet(path, fetchImpl = fetch) {
  if (!path.startsWith("/v2/")) throw new TypeError("Unsupported Docker Hub API path.");
  const response = await fetchImpl(`${DOCKER_HUB_ORIGIN}${path}`, {
    method: "GET",
    headers: { accept: "application/json", "user-agent": "BnhassinAgent-DockerMCPPreview/1.0" },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) {
    const error = new Error(`Docker Hub returned HTTP ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }
  return response.json();
}

export async function getDockerHubProfile(username = "bnhassin", fetchImpl = fetch) {
  const safeUsername = validateDockerHubUsername(username);
  const profile = await dockerHubGet(`/v2/users/${encodeURIComponent(safeUsername)}/`, fetchImpl);
  return normalizeDockerHubProfile(profile, safeUsername);
}

export async function getDockerHubRepositories(username = "bnhassin", page = 1, pageSize = 25, fetchImpl = fetch) {
  const safeUsername = validateDockerHubUsername(username);
  const safePage = Math.min(5, Math.max(1, Number.parseInt(page, 10) || 1));
  const safePageSize = Math.min(25, Math.max(1, Number.parseInt(pageSize, 10) || 25));
  const path = `/v2/repositories/${encodeURIComponent(safeUsername)}/?page=${safePage}&page_size=${safePageSize}`;
  return normalizeDockerHubRepositories(await dockerHubGet(path, fetchImpl));
}
