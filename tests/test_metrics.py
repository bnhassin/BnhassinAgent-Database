from bnhassinagent.events import AgentEvent
from bnhassinagent.metrics import calculate_funnel


def event(event_id, name, environment="preview", session="s1"):
    from datetime import datetime, timezone
    return AgentEvent(event_id, name, datetime.now(timezone.utc), session, environment)


def test_funnel_rates_and_counts():
    events = [
        event("1", "prompt_started"),
        event("2", "prompt_started", session="s2"),
        event("3", "preview_rendered"),
        event("4", "board_saved"),
    ]
    result = calculate_funnel(events)
    assert result == {
        "prompts_started": 2,
        "previews_rendered": 1,
        "boards_saved": 1,
        "prompt_to_preview_pct": 50.0,
        "preview_to_board_pct": 100.0,
        "prompt_to_board_pct": 50.0,
    }


def test_duplicate_event_id_is_counted_once():
    duplicate = event("same", "prompt_started")
    result = calculate_funnel([duplicate, duplicate])
    assert result["prompts_started"] == 1


def test_environment_isolation():
    events = [event("1", "prompt_started"), event("2", "board_saved", "production")]
    assert calculate_funnel(events, "preview")["boards_saved"] == 0
    assert calculate_funnel(events, "production")["prompts_started"] == 0


def test_zero_denominators_return_zero():
    result = calculate_funnel([event("1", "board_saved")])
    assert result["preview_to_board_pct"] == 0.0
    assert result["prompt_to_board_pct"] == 0.0
