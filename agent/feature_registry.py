"""Feature registry for BnhassinAgent capabilities.

The registry is deliberately dependency-free so it can be reused by the Vercel
API layer, MCP adapters, dashboards, and future persistent storage.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Iterable, Literal

FeatureStatus = Literal["experimental", "preview", "stable", "disabled"]
RiskLevel = Literal["read", "low", "medium", "high"]


@dataclass(frozen=True, slots=True)
class Feature:
    """A user-facing or agent-facing capability."""

    key: str
    name: str
    description: str
    status: FeatureStatus = "preview"
    risk: RiskLevel = "read"
    enabled: bool = True
    owner: str = "BnhassinAgent"

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


class FeatureRegistry:
    """In-memory registry with deterministic ordering and safe lookup."""

    def __init__(self, features: Iterable[Feature] = ()) -> None:
        self._features: dict[str, Feature] = {}
        for feature in features:
            self.register(feature)

    def register(self, feature: Feature) -> None:
        if not feature.key or "/" in feature.key:
            raise ValueError("feature key must be non-empty and contain no '/'")
        if feature.key in self._features:
            raise ValueError(f"feature already registered: {feature.key}")
        self._features[feature.key] = feature

    def get(self, key: str) -> Feature | None:
        return self._features.get(key)

    def list(self, *, enabled_only: bool = False) -> list[Feature]:
        items = self._features.values()
        if enabled_only:
            items = (feature for feature in items if feature.enabled)
        return sorted(items, key=lambda feature: feature.key)

    def to_dict(self) -> list[dict[str, object]]:
        return [feature.to_dict() for feature in self.list()]


DEFAULT_FEATURES = FeatureRegistry(
    [
        Feature(
            key="agent/session",
            name="Agent Sessions",
            description="Create and expose managed agent sessions through the API.",
            status="preview",
            risk="medium",
        ),
        Feature(
            key="github/sync",
            name="GitHub Sync",
            description="Project GitHub repositories, issues, pull requests and Actions into the control plane.",
            status="experimental",
            risk="read",
        ),
        Feature(
            key="mcp/tools",
            name="MCP Tool Registry",
            description="Expose governed MCP capabilities with explicit risk metadata.",
            status="experimental",
            risk="medium",
        ),
        Feature(
            key="docs/publish",
            name="Documentation Publishing",
            description="Promote reviewed documentation changes from GitHub to Mintlify.",
            status="experimental",
            risk="medium",
        ),
    ]
)
