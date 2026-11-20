import test from "node:test";
import assert from "node:assert/strict";
import profileHandler from "../../../../api/docker/profile.js";
import repositoriesHandler from "../../../../api/docker/repositories.js";
import certificationHandler from "../../../../api/docker/certification.js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test("Docker API endpoints reject non-GET methods", async () => {
  for (const handler of [profileHandler, repositoriesHandler, certificationHandler]) {
    const req = { method: "POST", query: {} };
    const res = responseRecorder();
    await handler(req, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, "GET");
    assert.equal(res.body.error, "Method not allowed.");
  }
});

test("Preview certification cannot return GO_LIVE when integration checks are untested", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => String(url).includes("/users/")
      ? { username: "bnhassin" }
      : { count: 0, results: [] }
  });
  try {
    const req = { method: "GET", query: {} };
    const res = responseRecorder();
    await certificationHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.environment, "preview");
    assert.equal(res.body.goLive, false);
    assert.equal(res.body.overallStatus, "NOT_READY");
    assert.ok(res.body.checks.some((check) => check.status === "NOT_TESTED"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
