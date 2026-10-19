"""Typed, dependency-free certification primitives for BnhassinAgent.

This module computes a conservative release state from explicit control results.
It does not run checks or manufacture evidence; callers must collect real results.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Iterable


class ControlStatus(StrEnum):
    NOT_TESTED = "NOT_TESTED"
    PENDING = "PENDING"
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    BLOCKED = "BLOCKED"


class CertificationStatus(StrEnum):
    NOT_READY = "NOT_READY"
    CERTIFICATION_IN_PROGRESS = "CERTIFICATION_IN_PROGRESS"
    READY_FOR_GO_LIVE = "READY_FOR_GO_LIVE"
    GO_LIVE = "GO_LIVE"
    DEGRADED = "DEGRADED"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True, slots=True)
class Evidence:
    """Evidence metadata; never store credentials or raw sensitive payloads."""

    evidence_id: str
    control_id: str
    source_url: str
    observed_at: datetime
    commit_sha: str
    status: ControlStatus
    summary: str
    redactions_applied: bool = True

    def is_attributable_to(self, *, control_id: str, commit_sha: str) -> bool:
        return bool(
            self.evidence_id.strip()
            and self.source_url.startswith(("https://", "http://"))
            and self.control_id == control_id
            and self.commit_sha == commit_sha
            and self.summary.strip()
            and self.redactions_applied
        )


@dataclass(frozen=True, slots=True)
class ControlResult:
    control_id: str
    status: ControlStatus
    mandatory: bool = True
    evidence: tuple[Evidence, ...] = field(default_factory=tuple)

    def has_valid_pass_evidence(self, *, commit_sha: str) -> bool:
        return any(
            evidence.status == ControlStatus.PASS
            and evidence.is_attributable_to(
                control_id=self.control_id, commit_sha=commit_sha
            )
            for evidence in self.evidence
        )


@dataclass(frozen=True, slots=True)
class CertificationSnapshot:
    repository: str
    commit_sha: str
    controls: tuple[ControlResult, ...]
    production_deployment_evidence: Evidence | None = None
    production_health_evidence: Evidence | None = None
    evaluated_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def status(self) -> CertificationStatus:
        """GO_LIVE requires attributable deployment and health evidence."""
        mandatory = [control for control in self.controls if control.mandatory]
        if not mandatory or not self.repository.strip() or not self.commit_sha.strip():
            return CertificationStatus.NOT_READY

        for control in mandatory:
            if control.status in (ControlStatus.FAIL, ControlStatus.BLOCKED):
                return CertificationStatus.BLOCKED

        if any(
            control.status in (ControlStatus.NOT_TESTED, ControlStatus.PENDING)
            for control in mandatory
        ):
            return CertificationStatus.CERTIFICATION_IN_PROGRESS

        if any(control.status == ControlStatus.WARN for control in mandatory):
            return CertificationStatus.DEGRADED

        if any(
            control.status != ControlStatus.PASS
            or not control.has_valid_pass_evidence(commit_sha=self.commit_sha)
            for control in mandatory
        ):
            return CertificationStatus.NOT_READY

        if self.production_deployment_evidence is None:
            return CertificationStatus.READY_FOR_GO_LIVE

        deployment_ok = (
            self.production_deployment_evidence.status == ControlStatus.PASS
            and self.production_deployment_evidence.is_attributable_to(
                control_id="PROD-001", commit_sha=self.commit_sha
            )
        )
        health_ok = (
            self.production_health_evidence is not None
            and self.production_health_evidence.status == ControlStatus.PASS
            and self.production_health_evidence.is_attributable_to(
                control_id="HEALTH-001", commit_sha=self.commit_sha
            )
        )
        if not deployment_ok or not health_ok:
            return CertificationStatus.DEGRADED

        return CertificationStatus.GO_LIVE


def make_control(
    control_id: str,
    status: ControlStatus,
    evidence: Iterable[Evidence] = (),
    *,
    mandatory: bool = True,
) -> ControlResult:
    """Convenience constructor for immutable, typed control results."""
    return ControlResult(
        control_id=control_id,
        status=status,
        mandatory=mandatory,
        evidence=tuple(evidence),
    )
