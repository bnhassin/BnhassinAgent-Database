import {
  CertificationCheck,
  GoLiveResult,
  GoLiveStatus,
} from "./types";

export function calculateGoLive(
  checks: CertificationCheck[],
  environment = "production",
  certificationRunId?: string,
): GoLiveResult {
  const required = checks.filter((c) => c.required && c.enabled);

  const failed = required.filter((c) => c.status === "FAIL");
  const blocked = required.filter((c) => c.status === "BLOCKED");
  const notTested = required.filter((c) => c.status === "NOT_TESTED");
  const pending = required.filter((c) => c.status === "PENDING");
  const passed = required.filter((c) => c.status === "PASS");
  const warnings = required.filter((c) => c.status === "WARN");

  let status: GoLiveStatus = "NOT_READY";

  if (failed.length || blocked.length) status = "BLOCKED";
  else if (notTested.length) status = "NOT_READY";
  else if (pending.length) status = "CERTIFICATION_IN_PROGRESS";
  else if (required.length > 0 && passed.length === required.length) {
    status = "GO_LIVE";
  } else if (warnings.length) {
    status = "DEGRADED";
  }

  return {
    status,
    environment,
    eligible: status === "GO_LIVE",
    requiredChecks: required.length,
    passed: passed.length,
    warnings: warnings.length,
    failed: failed.length,
    blocked: blocked.length,
    notTested: notTested.length,
    certificationRunId,
    verifiedAt: new Date().toISOString(),
    blockers: [
      ...failed.map((c) => c.id),
      ...blocked.map((c) => c.id),
      ...notTested.map((c) => c.id),
      ...pending.map((c) => c.id),
    ],
  };
}
