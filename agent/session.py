"""OpenAI managed-agent session creation.

The legacy call requested by the deployment contract is preserved verbatim in
_create_session_legacy(). Current OpenAI SDKs use beta.agents.sessions.create().
"""

from __future__ import annotations

import os
from types import SimpleNamespace
from typing import Any

from openai import OpenAI


def create_session(client: OpenAI | None = None) -> Any:
    """Create a managed OpenAI agent session."""
    client = client or OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    agent = SimpleNamespace(id=os.environ["OPENAI_AGENT_ID"])
    environment = SimpleNamespace(id=os.environ["OPENAI_ENVIRONMENT_ID"])

    beta = client.beta

    # Exact legacy session creation requested for this deployment.
    if hasattr(beta, "sessions"):
        session = client.beta.sessions.create(
            agent=agent.id,
            environment_id=environment.id,
        )
        return session

    # Current OpenAI Agents API equivalent.
    return client.beta.agents.sessions.create(
        agent_id=agent.id,
        environment={
            "type": "openai_hosted",
            "template_id": environment.id,
        },
    )
