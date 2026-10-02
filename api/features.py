"""Vercel endpoint exposing the BnhassinAgent feature registry."""

from __future__ import annotations

import json

from agent.feature_registry import DEFAULT_FEATURES


def handler(request):
    """Return enabled features as a small, stable JSON contract."""
    if getattr(request, "method", "GET") != "GET":
        return {
            "statusCode": 405,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Method Not Allowed"}),
        }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "service": "BnhassinAgent-Database",
                "version": 1,
                "features": [
                    feature.to_dict()
                    for feature in DEFAULT_FEATURES.list(enabled_only=True)
                ],
            }
        ),
    }
