from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import httpx

from config import TavusRuntimeSettings
from models.tavus import TavusPreviewRuntimeState


class TavusServiceError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class TavusConversationResult:
    conversation_id: str
    conversation_url: str
    status: str


def _append_meeting_token(conversation_url: str, meeting_token: str) -> str:
    parsed_url = urlparse(conversation_url)
    query_items = dict(parse_qsl(parsed_url.query, keep_blank_values=True))
    query_items["t"] = meeting_token

    return urlunparse(parsed_url._replace(query=urlencode(query_items)))


async def create_conversation(
    runtime_state: TavusPreviewRuntimeState, settings: TavusRuntimeSettings
) -> TavusConversationResult:
    payload = {
        "replica_id": runtime_state.replica_id,
        "persona_id": runtime_state.persona_id,
        "conversation_name": settings.conversation_name,
        "max_participants": settings.max_participants,
        "require_auth": settings.require_auth,
        "test_mode": False,
    }
    headers = {
        "Content-Type": "application/json",
        "x-api-key": runtime_state.api_key_secret,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.post(
                f"{settings.api_base_url.rstrip('/')}/conversations",
                headers=headers,
                json=payload,
            )
    except httpx.TimeoutException as exc:
        raise TavusServiceError(
            "The live preview timed out while starting. Please try again.",
            status_code=504,
        ) from exc
    except httpx.HTTPError as exc:
        raise TavusServiceError(
            "The live preview is unavailable right now. Please try again later."
        ) from exc

    if response.status_code == 429:
        raise TavusServiceError(
            "The live preview is at capacity right now. Please try again shortly."
        )

    if response.status_code >= 400:
        raise TavusServiceError(
            "The live preview could not be started right now. Please try again later."
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise TavusServiceError(
            "The live preview returned an invalid response. Please try again later."
        ) from exc

    conversation_id = str(data.get("conversation_id", "")).strip()
    conversation_url = str(data.get("conversation_url", "")).strip()
    status = str(data.get("status", "")).strip() or "active"

    if not conversation_id or not conversation_url:
        raise TavusServiceError(
            "The live preview could not be started right now. Please try again later."
        )

    if settings.require_auth:
        meeting_token = str(data.get("meeting_token", "")).strip()
        if not meeting_token:
            raise TavusServiceError(
                "The live preview could not be secured right now. Please try again later."
            )

        conversation_url = _append_meeting_token(conversation_url, meeting_token)

    return TavusConversationResult(
        conversation_id=conversation_id,
        conversation_url=conversation_url,
        status=status,
    )


async def delete_conversation(
    runtime_state: TavusPreviewRuntimeState,
    settings: TavusRuntimeSettings,
    *,
    conversation_id: str,
) -> None:
    headers = {
        "x-api-key": runtime_state.api_key_secret,
    }

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout_seconds) as client:
            response = await client.delete(
                f"{settings.api_base_url.rstrip('/')}/conversations/{conversation_id}",
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise TavusServiceError(
            "The live preview cleanup failed after session creation.",
            status_code=503,
        ) from exc

    if response.status_code >= 400 and response.status_code != 404:
        raise TavusServiceError(
            "The live preview cleanup failed after session creation.",
            status_code=503,
        )
