"""Deterministic, deduplicated funnel metrics for a selected environment."""

from __future__ import annotations

from collections.abc import Iterable

from .events import AgentEvent


def calculate_funnel(events: Iterable[AgentEvent], environment: str = "preview") -> dict[str, int | float]:
    """Calculate unique-event funnel counts; repeated event IDs count once."""
    unique: dict[str, AgentEvent] = {}
    for event in events:
        if event.environment == environment:
            unique.setdefault(event.event_id, event)

    prompts = sum(e.event_name == "prompt_started" for e in unique.values())
    previews = sum(e.event_name == "preview_rendered" for e in unique.values())
    boards = sum(e.event_name == "board_saved" for e in unique.values())

    def rate(numerator: int, denominator: int) -> float:
        return round((numerator / denominator) * 100, 2) if denominator else 0.0

    return {
        "prompts_started": prompts,
        "previews_rendered": previews,
        "boards_saved": boards,
        "prompt_to_preview_pct": rate(previews, prompts),
        "preview_to_board_pct": rate(boards, previews),
        "prompt_to_board_pct": rate(boards, prompts),
    }
