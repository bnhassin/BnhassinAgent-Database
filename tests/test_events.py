from datetime import datetime, timezone

import pytest

from bnhassinagent.events import AgentEvent, event_to_dict


def test_create_event_uses_unique_id_and_utc_timestamp():
    first = AgentEvent.create("prompt_started", "session-1")
    second = AgentEvent.create("prompt_started", "session-1")
    assert first.event_id != second.event_id
    assert first.occurred_at.tzinfo is not None
    assert first.environment == "preview"


def test_event_requires_timezone_aware_timestamp():
    with pytest.raises(ValueError, match="timezone-aware"):
        AgentEvent("evt-1", "prompt_started", datetime(2026, 1, 1), "s1", "preview")


def test_event_requires_session_id():
    with pytest.raises(ValueError, match="session_id"):
        AgentEvent.create("prompt_started", " ")


def test_serialization_keeps_utc_timestamp_and_envelope():
    event = AgentEvent("evt-1", "board_saved", datetime(2026, 1, 1, tzinfo=timezone.utc), "s1", "preview")
    data = event_to_dict(event)
    assert data["event_id"] == "evt-1"
    assert data["occurred_at"].endswith("+00:00")
    assert data["environment"] == "preview"
