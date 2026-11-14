"""Validated event envelope shared by Chat, Board Preview and analytics."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

EventName = Literal["prompt_started", "preview_rendered", "board_saved"]
Environment = Literal["preview", "production"]


@dataclass(frozen=True, slots=True)
class AgentEvent:
    event_id: str
    event_name: EventName
    occurred_at: datetime
    session_id: str
    environment: Environment
    payload: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.event_id.strip():
            raise ValueError("event_id must not be empty")
        if not self.session_id.strip():
            raise ValueError("session_id must not be empty")
        if self.occurred_at.tzinfo is None or self.occurred_at.utcoffset() is None:
            raise ValueError("occurred_at must be timezone-aware")
        if self.event_name not in {"prompt_started", "preview_rendered", "board_saved"}:
            raise ValueError("unsupported event_name")
        if self.environment not in {"preview", "production"}:
            raise ValueError("environment must be preview or production")

    @classmethod
    def create(
        cls,
        event_name: EventName,
        session_id: str,
        environment: Environment = "preview",
        payload: dict[str, Any] | None = None,
    ) -> "AgentEvent":
        return cls(
            event_id=str(uuid4()),
            event_name=event_name,
            occurred_at=datetime.now(timezone.utc),
            session_id=session_id,
            environment=environment,
            payload=payload or {},
        )


def event_to_dict(event: AgentEvent) -> dict[str, Any]:
    """Serialize an event with an explicit UTC ISO-8601 timestamp."""
    return {
        "event_id": event.event_id,
        "event_name": event.event_name,
        "occurred_at": event.occurred_at.astimezone(timezone.utc).isoformat(),
        "session_id": event.session_id,
        "environment": event.environment,
        "payload": event.payload,
    }
