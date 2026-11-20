import { getDockerHubProfile } from "../../apps/docker-mcp-portal/lib/docker-hub.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const username = process.env.DOCKER_HUB_USERNAME || "bnhassin";
    const profile = await getDockerHubProfile(username);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ source: "Docker Hub public API", profile });
  } catch (error) {
    const status = Number.isInteger(error.statusCode) ? 502 : 502;
    return res.status(status).json({ error: "Docker Hub profile could not be read.", detail: error.message });
  }
}
