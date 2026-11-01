import { createHmac, timingSafeEqual } from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 300;

const ALLOWED_EVENTS = new Set([
  "deployment.started",
  "deployment.succeeded",
  "deployment.failed",
  "documentation.updated",
  "documentation.published",
  "feedback.created",
  "feedback.updated",
  "agent.started",
  "agent.completed",
  "agent.failed",
]);

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
    req.on("aborted", () => reject(Object.assign(new Error("Request aborted"), { statusCode: 400 })));
  });
}

function safeEqualHex(expectedHex, receivedHex) {
  if (!/^[a-f0-9]{64}$/i.test(receivedHex || "")) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const secret = process.env.MINTLIFY_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "Webhook receiver is not configured" });
  }

  const timestamp = req.headers["x-bnhassin-timestamp"];
  const signatureHeader = req.headers["x-bnhassin-signature"];
  const eventId = req.headers["x-bnhassin-event-id"];

  if (
    typeof timestamp !== "string" ||
    !/^\d{10}$/.test(timestamp) ||
    typeof signatureHeader !== "string" ||
    typeof eventId !== "string" ||
    eventId.length < 1 ||
    eventId.length > 200
  ) {
    return res.status(401).json({ error: "Missing or invalid webhook authentication headers" });
  }

  const timestampSeconds = Number(timestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) {
    return res.status(401).json({ error: "Webhook timestamp outside allowed window" });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || "Invalid request body" });
  }

  const suppliedSignature = signatureHeader.replace(/^sha256=/i, "");
  const expectedSignature = createHmac("sha256", secret)
    .update(timestamp + ".")
    .update(rawBody)
    .digest("hex");

  if (!safeEqualHex(expectedSignature, suppliedSignature)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Request body must be valid JSON" });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.event_id !== eventId ||
    typeof payload.type !== "string" ||
    !ALLOWED_EVENTS.has(payload.type)
  ) {
    return res.status(400).json({ error: "Invalid or unsupported webhook event" });
  }

  // Do not log payload contents: feedback may contain personal or customer data.
  // A durable event sink / database is intentionally a separate integration step.
  console.info(JSON.stringify({
    message: "mintlify_webhook_accepted",
    event_id: eventId,
    event_type: payload.type,
    received_at: new Date().toISOString(),
  }));

  return res.status(202).json({
    accepted: true,
    event_id: eventId,
    event_type: payload.type,
  });
}
