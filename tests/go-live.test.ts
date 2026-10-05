import { calculateGoLive } from "../agent/certification/go-live";
import { CertificationCheck } from "../agent/certification/types";

const pass = (id: string): CertificationCheck => ({
  id,
  domain: "OBSERVABILITY",
  required: true,
  enabled: true,
  status: "PASS",
  environment: "production",
});

describe("calculateGoLive", () => {
  it("returns GO_LIVE only when all required checks pass", () => {
    const result = calculateGoLive([
      pass("MCP.PROTOCOL_HANDSHAKE"),
      pass("DATABASE.PERSISTENCE"),
    ]);

    expect(result.status).toBe("GO_LIVE");
    expect(result.eligible).toBe(true);
  });

  it("blocks when a required check fails", () => {
    const checks = [
      pass("MCP.PROTOCOL_HANDSHAKE"),
      { ...pass("DATABASE.PERSISTENCE"), status: "FAIL" as const },
    ];

    const result = calculateGoLive(checks);

    expect(result.status).toBe("BLOCKED");
    expect(result.eligible).toBe(false);
  });

  it("does not allow untested checks to pass certification", () => {
    const result = calculateGoLive([
      pass("MCP.PROTOCOL_HANDSHAKE"),
      { ...pass("DATABASE.PERSISTENCE"), status: "NOT_TESTED" as const },
    ]);

    expect(result.status).toBe("NOT_READY");
    expect(result.eligible).toBe(false);
  });
});
