"""Vercel serverless endpoint for creating an OpenAI agent session."""

from __future__ import annotations

import json

from agent.session import create_session


def handler(request):
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
    except Exception as exc:
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(exc)}),
        }
