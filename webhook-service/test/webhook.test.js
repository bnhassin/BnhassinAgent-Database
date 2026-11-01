import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { EventEmitter } from "node:events";
import handler from "../api/webhooks/mintlify.js";

const SECRET = "test-secret-with-at-least-thirty-two-characters";
const NOW = 1793566000;

function makeResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function makeRequest({ method = "POST", body = {}, headers = {} } = {}) {
  const req = new EventEmitter();
  req.method = method;
  req.headers = headers;
  req.destroy = () => {};
  process.nextTick(() => {
    req.emit("data", Buffer.from(JSON.stringify(body)));
    req.emit("end");
  });
  return req;
}

function signedHeaders(body, eventId, timestamp = String(NOW)) {
  const raw = Buffer.from(JSON.stringify(body));
  const signature = createHmac("sha256", SECRET)
    .update(timestamp + ".")
    .update(raw)
    .digest("hex");
  return {
    "x-bnhassin-timestamp": timestamp,
    "x-bnhassin-event-id": eventId,
    "x-bnhassin-signature": "sha256=" + signature,
  };
}

async function invoke({ method, body, headers }) {
  const oldNow = Date.now;
  Date.now = () => NOW * 1000;
  process.env.MINTLIFY_WEBHOOK_SECRET = SECRET;
  const req = makeRequest({ method, body, headers });
  const res = makeResponse();
  try {
    await handler(req, res);
    return res;
  } finally {
    Date.now = oldNow;
  }
}

test("accepts a correctly signed documentation event", async () => {
  const body = {
    event_id: "evt-test-001",
    type: "documentation.published",
    data: { deployment_id: "preview" },
  };
  const res = await invoke({ body, headers: signedHeaders(body, body.event_id) });
  assert.equal(res.statusCode, 202);
  assert.equal(res.body.accepted, true);
  assert.equal(res.body.event_id, body.event_id);
});

test("rejects unsigned requests", async () => {
  const res = await invoke({
    body: { event_id: "evt-test-002", type: "documentation.published" },
    headers: {},
  });
  assert.equal(res.statusCode, 401);
});

test("rejects an invalid HMAC signature", async () => {
  const body = { event_id: "evt-test-003", type: "documentation.published" };
  const headers = signedHeaders(body, body.event_id);
  headers["x-bnhassin-signature"] = "sha256=" + "0".repeat(64);
  const res = await invoke({ body, headers });
  assert.equal(res.statusCode, 401);
});

test("rejects stale timestamps", async () => {
  const body = { event_id: "evt-test-004", type: "documentation.published" };
  const res = await invoke({
    body,
    headers: signedHeaders(body, body.event_id, String(NOW - 301)),
  });
  assert.equal(res.statusCode, 401);
});

test("rejects unsupported event types", async () => {
  const body = { event_id: "evt-test-005", type: "unknown.event" };
  const res = await invoke({ body, headers: signedHeaders(body, body.event_id) });
  assert.equal(res.statusCode, 400);
});

test("rejects mismatched event identifiers", async () => {
  const body = { event_id: "evt-test-006", type: "documentation.published" };
  const res = await invoke({ body, headers: signedHeaders(body, "different-id") });
  assert.equal(res.statusCode, 400);
});

test("rejects methods other than POST", async () => {
  const res = await invoke({ method: "GET", body: {}, headers: {} });
  assert.equal(res.statusCode, 405);
});
