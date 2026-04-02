from __future__ import annotations

import logging
from math import ceil
from threading import Lock
from time import monotonic
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status

from config import TavusConfigurationError, TavusRuntimeSettings
from dependencies import (
    get_notification_service,
    get_tavus_admin_service,
    get_tavus_preview_state_service,
    get_tavus_runtime_config,
)
from models.tavus import (
    TavusConversationRequestBody,
    TavusConversationResponse,
    TavusPreviewSessionCompleteRequest,
    TavusPreviewSessionCompleteResponse,
    TavusPreviewRuntimeState,
    TavusUsageRollup,
)
from services.notifications import NotificationService
from services.supabase_client import SupabaseRestError
from services.tavus import TavusServiceError, create_conversation, delete_conversation
from services.tavus_admin import TavusAdminService
from services.tavus_state import TavusPreviewStateService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/tavus", tags=["tavus"])
EXHAUSTED_PREVIEW_MESSAGE = (
    "We're overloaded right now. Check back in later."
)


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


def _ensure_runtime_is_usable(runtime_state: TavusPreviewRuntimeState) -> None:
    if runtime_state.scenario_status in {"disabled", "failed"}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The live preview is currently unavailable. Please try again later.",
        )

    if runtime_state.tavus_api_key_status in {"disabled", "failed", "rotating"}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The live preview is currently unavailable. Please try again later.",
        )


async def _dispatch_low_quota_alerts(
    *,
    runtime_state_service: TavusPreviewStateService,
    notifications: NotificationService,
    rollups: list[TavusUsageRollup],
    active_key_label: str | None = None,
) -> None:
    for rollup in rollups:
        if (
            rollup.low_quota_alert_sent_at is not None
            or rollup.low_quota_threshold_seconds <= 0
            or rollup.seconds_remaining_estimate > rollup.low_quota_threshold_seconds
            or rollup.tavus_api_key_status == "disabled"
        ):
            continue

        try:
            result = await notifications.send_low_quota_alert(
                key_label=active_key_label or "Active Tavus key",
                rollup=rollup,
            )
        except Exception:
            logger.exception(
                "Low quota reminder failed.",
                extra={"tavus_api_key_id": str(rollup.tavus_api_key_id)},
            )
            continue

        if result.sent and result.sent_at is not None:
            try:
                await runtime_state_service.mark_low_quota_alert_sent(
                    tavus_api_key_id=rollup.tavus_api_key_id,
                    sent_at=result.sent_at,
                )
            except SupabaseRestError:
                logger.exception(
                    "Persisting low quota alert timestamp failed.",
                    extra={"tavus_api_key_id": str(rollup.tavus_api_key_id)},
                )


async def _handle_exhausted_preview_attempt(
    *,
    runtime_state: TavusPreviewRuntimeState,
    payload: TavusConversationRequestBody,
    tavus_admin: TavusAdminService,
    notifications: NotificationService,
) -> None:
    denial = await tavus_admin.record_exhausted_denial(
        tavus_api_key_id=runtime_state.tavus_api_key_id,
        tavus_preview_scenario_id=runtime_state.tavus_preview_scenario_id,
        demo_request_id=payload.demo_request_id,
    )

    if denial.should_send_sales_email:
        demo_request = None
        if denial.demo_request_id:
            try:
                demo_request = await tavus_admin.get_demo_request(
                    demo_request_id=denial.demo_request_id
                )
            except SupabaseRestError:
                logger.exception(
                    "Fetching exhausted denial demo request failed.",
                    extra={"demo_request_id": str(denial.demo_request_id)},
                )

        try:
            result = await notifications.send_exhausted_capacity_alert(
                key_label=runtime_state.api_key_label,
                attempted_at=denial.attempted_at,
                request_name=(
                    str(demo_request.get("name")) if isinstance(demo_request, dict) else None
                ),
                request_email=(
                    str(demo_request.get("email"))
                    if isinstance(demo_request, dict)
                    else None
                ),
                request_institution=(
                    str(demo_request.get("institution"))
                    if isinstance(demo_request, dict)
                    else None
                ),
            )
            if result.sent and result.sent_at is not None:
                await tavus_admin.mark_exhausted_alert_sent(
                    denial_id=denial.denial_id,
                    tavus_api_key_id=runtime_state.tavus_api_key_id,
                    sent_at=result.sent_at,
                )
        except Exception:
            logger.exception(
                "Exhausted Tavus capacity alert failed.",
                extra={"tavus_api_key_id": str(runtime_state.tavus_api_key_id)},
            )


@router.post(
    "/conversation",
    response_model=TavusConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def start_tavus_conversation(
    request: Request,
    payload: TavusConversationRequestBody | None = Body(default=None),
    runtime_state_service: TavusPreviewStateService = Depends(
        get_tavus_preview_state_service
    ),
    tavus_admin: TavusAdminService = Depends(get_tavus_admin_service),
    notifications: NotificationService = Depends(get_notification_service),
) -> TavusConversationResponse:
    payload = payload or TavusConversationRequestBody()

    try:
        runtime_settings = get_tavus_runtime_config()
    except TavusConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    retry_after = preview_launch_gate.check_and_record(
        _get_client_id(request), runtime_settings.preview_cooldown_seconds
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
        expired_rollups = await runtime_state_service.close_expired_preview_sessions(
            preview_max_duration_seconds=runtime_settings.preview_max_duration_seconds
        )
        runtime_state = await runtime_state_service.get_runtime_state(
            preview_max_duration_seconds=runtime_settings.preview_max_duration_seconds,
            api_key_encryption_key=runtime_settings.api_key_encryption_key,
        )
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="The live preview is currently unavailable. Please try again later.",
        ) from exc

    if runtime_state is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The live preview is not configured yet.",
        )

    _ensure_runtime_is_usable(runtime_state)

    if (
        runtime_state.live_seconds_remaining_estimate <= 0
        or runtime_state.tavus_api_key_status == "exhausted"
    ):
        try:
            await _handle_exhausted_preview_attempt(
                runtime_state=runtime_state,
                payload=payload,
                tavus_admin=tavus_admin,
                notifications=notifications,
            )
        except SupabaseRestError:
            logger.exception(
                "Recording exhausted preview denial failed.",
                extra={"tavus_api_key_id": str(runtime_state.tavus_api_key_id)},
            )

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=EXHAUSTED_PREVIEW_MESSAGE,
        )

    await _dispatch_low_quota_alerts(
        runtime_state_service=runtime_state_service,
        notifications=notifications,
        rollups=expired_rollups,
        active_key_label=runtime_state.api_key_label,
    )

    conversation = None
    try:
        conversation = await create_conversation(runtime_state, runtime_settings)
        preview_session = await runtime_state_service.create_preview_session(
            runtime_state=runtime_state,
            conversation_id=conversation.conversation_id,
            demo_request_id=payload.demo_request_id,
        )
    except TavusServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except SupabaseRestError as exc:
        if conversation is not None:
            try:
                await delete_conversation(
                    api_key_secret=runtime_state.api_key_secret,
                    settings=runtime_settings,
                    conversation_id=conversation.conversation_id,
                )
            except TavusServiceError:
                logger.exception(
                    "Tavus conversation cleanup failed after preview session persistence error.",
                    extra={"conversation_id": conversation.conversation_id},
                )
        raise HTTPException(
            status_code=exc.status_code,
            detail="The live preview could not be started right now. Please try again later.",
        ) from exc

    return TavusConversationResponse(
        conversation_id=conversation.conversation_id,
        conversation_url=conversation.conversation_url,
        status=conversation.status,
        preview_session_id=preview_session.preview_session_id,
    )


@router.post(
    "/preview-sessions/{preview_session_id}/complete",
    response_model=TavusPreviewSessionCompleteResponse,
)
async def complete_tavus_preview_session(
    preview_session_id: UUID,
    payload: TavusPreviewSessionCompleteRequest,
    runtime_state_service: TavusPreviewStateService = Depends(
        get_tavus_preview_state_service
    ),
    notifications: NotificationService = Depends(get_notification_service),
) -> TavusPreviewSessionCompleteResponse:
    try:
        runtime_settings = get_tavus_runtime_config()
    except TavusConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        cleanup_context = await runtime_state_service.get_preview_session_cleanup_context(
            preview_session_id=preview_session_id,
            api_key_encryption_key=runtime_settings.api_key_encryption_key,
        )
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="The live preview session could not be completed right now.",
        ) from exc

    if cleanup_context is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The live preview session was not found.",
        )

    if not cleanup_context.already_completed:
        try:
            await delete_conversation(
                api_key_secret=cleanup_context.api_key_secret,
                settings=runtime_settings,
                conversation_id=cleanup_context.conversation_id,
            )
        except TavusServiceError as exc:
            logger.exception(
                "Tavus conversation cleanup failed while completing preview session.",
                extra={"conversation_id": cleanup_context.conversation_id},
            )
            raise HTTPException(
                status_code=exc.status_code,
                detail="The live preview session could not be completed right now.",
            ) from exc

    try:
        expired_rollups = await runtime_state_service.close_expired_preview_sessions(
            preview_max_duration_seconds=runtime_settings.preview_max_duration_seconds
        )
        completion = await runtime_state_service.complete_preview_session(
            preview_session_id=preview_session_id,
            end_reason=payload.end_reason,
            preview_max_duration_seconds=runtime_settings.preview_max_duration_seconds,
        )
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="The live preview session could not be completed right now.",
        ) from exc

    if completion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The live preview session was not found.",
        )

    await _dispatch_low_quota_alerts(
        runtime_state_service=runtime_state_service,
        notifications=notifications,
        rollups=[*expired_rollups, completion.rollup],
    )

    return TavusPreviewSessionCompleteResponse(
        preview_session_id=completion.preview_session_id,
        already_completed=completion.already_completed,
        duration_seconds_estimate=completion.duration_seconds_estimate,
        end_reason=completion.end_reason,
    )
