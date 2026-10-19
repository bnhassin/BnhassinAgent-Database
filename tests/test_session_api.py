"""Unit tests for the Vercel session endpoint."""

from __future__ import annotations

import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from api.session import handler


class Request:
    def __init__(self, method: str) -> None:
        self.method = method


class SessionEndpointTests(unittest.TestCase):
    def test_rejects_non_post_methods(self) -> None:
        response = handler(Request("GET"))
        self.assertEqual(response["statusCode"], 405)
        self.assertEqual(json.loads(response["body"])["error"], "Method Not Allowed")

    @patch("api.session.create_session")
    def test_returns_session_metadata(self, create_session) -> None:
        create_session.return_value = SimpleNamespace(id="sess_test", status="active")
        response = handler(Request("POST"))
        self.assertEqual(response["statusCode"], 200)
        self.assertEqual(
            json.loads(response["body"]),
            {"id": "sess_test", "status": "active"},
        )

    @patch("api.session.create_session")
    def test_hides_internal_exception_details(self, create_session) -> None:
        create_session.side_effect = RuntimeError("sensitive internal detail")
        response = handler(Request("POST"))
        self.assertEqual(response["statusCode"], 500)
        self.assertEqual(
            json.loads(response["body"]),
            {"error": "Session creation failed"},
        )
        self.assertNotIn("sensitive internal detail", response["body"])


if __name__ == "__main__":
    unittest.main()
