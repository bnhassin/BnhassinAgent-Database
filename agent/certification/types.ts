export type CheckStatus =
  | "NOT_TESTED"
  | "PENDING"
  | "PASS"
  | "WARN"
  | "FAIL"
  | "BLOCKED";

export type GoLiveStatus =
  | "NOT_READY"
  | "CERTIFICATION_IN_PROGRESS"
  | "READY_FOR_GO_LIVE"
  | "GO_LIVE"
  | "DEGRADED"
  | "BLOCKED";

export type CertificationDomain =
  | "AGENT"
  | "VERCEL"
  | "MCP_SERVER"
  | "GITHUB"
  | "DATABASE"
  | "CONNECTORS"
  | "CI_CD"
  | "TRANSCRIPTS"
  | "OBSERVABILITY";

export interface CertificationCheck {
  id: string;
  domain: CertificationDomain;
  required: boolean;
  enabled: boolean;
  status: CheckStatus;
  observed?: unknown;
  expected?: unknown;
  environment: string;
  source?: string;
  evidenceRef?: string;
  updatedAt?: string;
}

export interface CertificationSnapshot {
  runId: string;
  environment: string;
  checks: CertificationCheck[];
  valid: boolean;
  createdAt: string;
}

export interface GoLiveResult {
  status: GoLiveStatus;
  environment: string;
  eligible: boolean;
  requiredChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  blocked: number;
  notTested: number;
  certificationRunId?: string;
  verifiedAt: string;
  blockers: string[];
}
