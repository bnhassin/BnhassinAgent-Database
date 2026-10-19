"""Safety tests for certification gate computation."""
from datetime import datetime, timezone
import unittest

from skills.certification.models import (
    CertificationSnapshot,
    CertificationStatus,
    ControlResult,
    ControlStatus,
    Evidence,
)


SHA = "a" * 40
NOW = datetime(2026, 10, 19, tzinfo=timezone.utc)


def passing_control(control_id: str) -> ControlResult:
    evidence = Evidence(
        evidence_id=f"ev-{control_id}",
        control_id=control_id,
        source_url="https://github.com/example/repo/actions/runs/123",
        observed_at=NOW,
        commit_sha=SHA,
        status=ControlStatus.PASS,
        summary="Verified by automated test.",
    )
    return ControlResult(control_id, ControlStatus.PASS, evidence=(evidence,))


class CertificationGateTests(unittest.TestCase):
    def test_missing_controls_is_not_ready(self):
        snapshot = CertificationSnapshot("owner/repo", SHA, ())
        self.assertEqual(snapshot.status(), CertificationStatus.NOT_READY)

    def test_missing_evidence_cannot_pass(self):
        snapshot = CertificationSnapshot(
            "owner/repo",
            SHA,
            (ControlResult("CI-001", ControlStatus.PASS),),
        )
        self.assertEqual(snapshot.status(), CertificationStatus.NOT_READY)

    def test_wrong_commit_evidence_cannot_pass(self):
        evidence = Evidence(
            "ev-ci", "CI-001", "https://github.com/example/run",
            NOW, "b" * 40, ControlStatus.PASS, "Run succeeded."
        )
        snapshot = CertificationSnapshot(
            "owner/repo", SHA,
            (ControlResult("CI-001", ControlStatus.PASS, evidence=(evidence,)),),
        )
        self.assertEqual(snapshot.status(), CertificationStatus.NOT_READY)

    def test_failure_blocks_release(self):
        snapshot = CertificationSnapshot(
            "owner/repo", SHA,
            (ControlResult("CI-001", ControlStatus.FAIL),),
        )
        self.assertEqual(snapshot.status(), CertificationStatus.BLOCKED)

    def test_preview_pass_only_yields_ready_not_go_live(self):
        snapshot = CertificationSnapshot(
            "owner/repo", SHA, (passing_control("CI-001"),),
            production_deployed=False,
        )
        self.assertEqual(snapshot.status(), CertificationStatus.READY_FOR_GO_LIVE)

    def test_production_without_health_is_degraded(self):
        snapshot = CertificationSnapshot(
            "owner/repo", SHA, (passing_control("CI-001"),),
            production_deployed=True, production_health_passed=False,
        )
        self.assertEqual(snapshot.status(), CertificationStatus.DEGRADED)

    def test_go_live_requires_production_and_health_evidence(self):
        snapshot = CertificationSnapshot(
            "owner/repo", SHA, (passing_control("CI-001"),),
            production_deployed=True, production_health_passed=True,
        )
        self.assertEqual(snapshot.status(), CertificationStatus.GO_LIVE)


if __name__ == "__main__":
    unittest.main()
