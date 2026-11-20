import test from "node:test";
import assert from "node:assert/strict";
import {
  validateDockerHubUsername,
  normalizeDockerHubProfile,
  normalizeDockerHubRepositories,
  getDockerHubProfile,
  getDockerHubRepositories
} from "../lib/docker-hub.js";

test("accepts the configured Docker Hub namespace", () => {
  assert.equal(validateDockerHubUsername("bnhassin"), "bnhassin");
});

test("rejects path fragments and upstream host injection", () => {
  assert.throws(() => validateDockerHubUsername("bnhassin/other"), /Invalid/);
  assert.throws(() => validateDockerHubUsername("https://example.com"), /Invalid/);
});

test("normalizes only public profile metadata", () => {
  const profile = normalizeDockerHubProfile({
    username: "bnhassin",
    full_name: "Bnhassin",
    location: "Tunisia",
    company: "Example",
    date_joined: "2020-01-01",
    password: "must-not-escape"
  }, "bnhassin");
  assert.deepEqual(Object.keys(profile), ["username","fullName","location","company","dateJoined","profileUrl"]);
  assert.equal(profile.username, "bnhassin");
  assert.equal("password" in profile, false);
});

test("normalizes repository inventory without write capabilities", () => {
  const result = normalizeDockerHubRepositories({
    count: 1,
    next: null,
    results: [{ name: "agent", namespace: "bnhassin", is_private: false, pull_count: 12, star_count: 2 }]
  });
  assert.equal(result.count, 1);
  assert.equal(result.repositories[0].name, "agent");
  assert.equal(result.repositories[0].isPrivate, false);
  assert.equal("delete" in result.repositories[0], false);
});

test("profile lookup uses the fixed Docker Hub API origin and GET", async () => {
  let requested;
  const fakeFetch = async (url, options) => {
    requested = { url, options };
    return { ok: true, json: async () => ({ username: "bnhassin" }) };
  };
  const result = await getDockerHubProfile("bnhassin", fakeFetch);
  assert.equal(result.username, "bnhassin");
  assert.equal(requested.url, "https://hub.docker.com/v2/users/bnhassin/");
  assert.equal(requested.options.method, "GET");
});

test("repository pagination is bounded", async () => {
  let requested;
  const fakeFetch = async (url) => {
    requested = url;
    return { ok: true, json: async () => ({ count: 0, results: [] }) };
  };
  await getDockerHubRepositories("bnhassin", 999, 500, fakeFetch);
  assert.match(requested, /page=5&page_size=25$/);
});

test("upstream errors are surfaced as bounded status errors", async () => {
  const fakeFetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(() => getDockerHubProfile("bnhassin", fakeFetch), /HTTP 429/);
});
