"""Vercel serverless endpoint for creating an OpenAI agent session."""

from __future__ import annotations

import json
import logging

from agent.session import create_session

logger = logging.getLogger(__name__)


def handler(request):
    """Create a managed session without returning internal exception details."""
    if getattr(request, "method", "GET") != "POST":
        return {
            "statusCode": 405,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Method Not Allowed"}),
        }

    try:
        session = create_session()
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "id": session.id,
                "status": getattr(session, "status", None),
            }),
        }
    except Exception:
        logger.exception("OpenAI session creation failed")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "Session creation failed"}),
        }
