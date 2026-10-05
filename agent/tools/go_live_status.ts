import { calculateGoLive } from "../certification/go-live";
import { CertificationCheck } from "../certification/types";

export interface GoLiveStatusInput {
  environment?: string;
  certificationRunId?: string;
  checks: CertificationCheck[];
}

export async function go_live_status(
  input: GoLiveStatusInput,
) {
  return calculateGoLive(
    input.checks,
    input.environment ?? "production",
    input.certificationRunId,
  );
}
