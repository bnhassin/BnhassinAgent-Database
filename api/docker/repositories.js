import { getDockerHubRepositories } from "../../apps/docker-mcp-portal/lib/docker-hub.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  try {
    const username = process.env.DOCKER_HUB_USERNAME || "bnhassin";
    const { page = "1", page_size = "25" } = req.query ?? {};
    const data = await getDockerHubRepositories(username, page, page_size);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({ source: "Docker Hub public API", ...data });
  } catch (error) {
    return res.status(502).json({ error: "Docker Hub repositories could not be read.", detail: error.message });
  }
}
