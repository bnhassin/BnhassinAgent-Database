export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  return res.status(200).json({
    service: "bnhassinagent-webhooks",
    status: "ok",
    webhook: "/webhooks/mintlify",
  });
}
