from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from models.tavus import (
    PreviewSessionEndReason,
    TavusPreviewRuntimeState,
    TavusPreviewSessionCompletionResult,
    TavusPreviewSessionRecord,
    TavusUsageRollup,
)
from services.supabase_client import SupabaseRestClient


class TavusPreviewStateService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    async def get_runtime_state(
        self, *, preview_max_duration_seconds: int, api_key_encryption_key: str
    ) -> TavusPreviewRuntimeState | None:
        result = await self._supabase.rpc(
            "get_tavus_preview_runtime",
            {
                "p_now": datetime.now(timezone.utc).isoformat(),
                "p_cap_duration_seconds": preview_max_duration_seconds,
                "p_encryption_key": api_key_encryption_key,
            },
        )
        row = result.first()
        if row is None:
            return None
        return _parse_runtime_state(row)

    async def create_preview_session(
        self,
        *,
        runtime_state: TavusPreviewRuntimeState,
        conversation_id: str,
        demo_request_id: UUID | None,
    ) -> TavusPreviewSessionRecord:
        row = await self._supabase.insert_one(
            "tavus_preview_sessions",
            {
                "tavus_api_key_id": str(runtime_state.tavus_api_key_id),
                "tavus_preview_scenario_id": str(runtime_state.tavus_preview_scenario_id),
                "conversation_id": conversation_id,
                "demo_request_id": str(demo_request_id) if demo_request_id else None,
            },
        )
        return TavusPreviewSessionRecord(
            preview_session_id=UUID(str(row["id"])),
            tavus_api_key_id=runtime_state.tavus_api_key_id,
        )

    async def close_expired_preview_sessions(
        self, *, preview_max_duration_seconds: int
    ) -> list[TavusUsageRollup]:
        result = await self._supabase.rpc(
            "close_expired_preview_sessions",
            {
                "p_now": datetime.now(timezone.utc).isoformat(),
                "p_cap_duration_seconds": preview_max_duration_seconds,
            },
        )
        return [_parse_rollup(row) for row in result.rows]

    async def complete_preview_session(
        self,
        *,
        preview_session_id: UUID,
        end_reason: PreviewSessionEndReason,
        preview_max_duration_seconds: int,
    ) -> TavusPreviewSessionCompletionResult | None:
        result = await self._supabase.rpc(
            "complete_preview_session",
            {
                "p_preview_session_id": str(preview_session_id),
                "p_end_reason": end_reason,
                "p_ended_at": datetime.now(timezone.utc).isoformat(),
                "p_cap_duration_seconds": preview_max_duration_seconds,
            },
        )
        row = result.first()
        if row is None:
            return None

        return TavusPreviewSessionCompletionResult(
            preview_session_id=UUID(str(row["preview_session_id"])),
            already_completed=bool(row["already_completed"]),
            duration_seconds_estimate=int(row["duration_seconds_estimate"]),
            end_reason=str(row["end_reason"]),
            rollup=_parse_rollup(row),
        )

    async def mark_low_quota_alert_sent(
        self, *, tavus_api_key_id: UUID, sent_at: datetime
    ) -> None:
        await self._supabase.update_one(
            "tavus_api_keys",
            filters={"id": f"eq.{tavus_api_key_id}"},
            payload={"low_quota_alert_sent_at": sent_at.isoformat()},
        )


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _parse_runtime_state(row: dict[str, Any]) -> TavusPreviewRuntimeState:
    return TavusPreviewRuntimeState(
        tavus_api_key_id=UUID(str(row["tavus_api_key_id"])),
        api_key_secret=str(row["api_key_secret"]),
        api_key_label=str(row.get("api_key_label", "Active key")),
        tavus_api_key_status=str(row["tavus_api_key_status"]),
        live_seconds_remaining_estimate=int(row["live_seconds_remaining_estimate"]),
        low_quota_threshold_seconds=int(row["low_quota_threshold_seconds"]),
        low_quota_alert_sent_at=_parse_datetime(row.get("low_quota_alert_sent_at")),
        tavus_preview_scenario_id=UUID(str(row["tavus_preview_scenario_id"])),
        persona_id=str(row["persona_id"]),
        replica_id=str(row["replica_id"]),
        scenario_status=str(row["scenario_status"]),
    )


def _parse_rollup(row: dict[str, Any]) -> TavusUsageRollup:
    return TavusUsageRollup(
        tavus_api_key_id=UUID(str(row["tavus_api_key_id"])),
        tavus_api_key_status=str(row["tavus_api_key_status"]),
        seconds_remaining_estimate=int(row["seconds_remaining_estimate"]),
        low_quota_threshold_seconds=int(row["low_quota_threshold_seconds"]),
        low_quota_alert_sent_at=_parse_datetime(row.get("low_quota_alert_sent_at")),
    )
