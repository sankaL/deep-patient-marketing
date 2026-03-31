from __future__ import annotations

from math import ceil
from threading import Lock
from time import monotonic

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from config import TavusConfigurationError, get_tavus_settings
from services.tavus import TavusServiceError, create_conversation


router = APIRouter(prefix="/api/tavus", tags=["tavus"])


class TavusConversationResponse(BaseModel):
    conversation_id: str
    conversation_url: str
    status: str


class PreviewLaunchGate:
    def __init__(self) -> None:
        self._last_launch_by_client: dict[str, float] = {}
        self._lock = Lock()

    def check_and_record(self, client_id: str, cooldown_seconds: int) -> int:
        if cooldown_seconds <= 0:
            return 0

        now = monotonic()

        with self._lock:
            self._prune(now, cooldown_seconds)
            last_launch = self._last_launch_by_client.get(client_id)
            if last_launch is not None:
                elapsed = now - last_launch
                if elapsed < cooldown_seconds:
                    return ceil(cooldown_seconds - elapsed)

            self._last_launch_by_client[client_id] = now

        return 0

    def _prune(self, now: float, cooldown_seconds: int) -> None:
        if len(self._last_launch_by_client) < 512:
            return

        cutoff = now - max(cooldown_seconds, 60) * 2
        stale_clients = [
            client_id
            for client_id, last_launch in self._last_launch_by_client.items()
            if last_launch < cutoff
        ]

        for client_id in stale_clients:
            self._last_launch_by_client.pop(client_id, None)


preview_launch_gate = PreviewLaunchGate()


def _get_client_id(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for.strip():
        return forwarded_for.split(",", maxsplit=1)[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


@router.post(
    "/conversation",
    response_model=TavusConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_tavus_conversation(request: Request) -> TavusConversationResponse:
    try:
        settings = get_tavus_settings()
    except TavusConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    retry_after = preview_launch_gate.check_and_record(
        _get_client_id(request), settings.preview_cooldown_seconds
    )
    if retry_after > 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Please wait {retry_after} seconds before starting another live session."
            ),
            headers={"Retry-After": str(retry_after)},
        )

    try:
        conversation = await create_conversation(settings)
    except TavusServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    return TavusConversationResponse(
        conversation_id=conversation.conversation_id,
        conversation_url=conversation.conversation_url,
        status=conversation.status,
    )