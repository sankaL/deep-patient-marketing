from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from models.admin import (
    TavusActiveKeySummary,
    TavusActiveScenarioSummary,
    TavusDashboardResponse,
    TavusPreviewDenialItem,
    TavusRecentUserItem,
    TavusRotateKeyResponse,
    TavusRotationHistoryItem,
    TavusUsageSummary,
)
from services.supabase_client import SupabaseRestClient


@dataclass(frozen=True)
class ExhaustedPreviewDenial:
    denial_id: UUID
    attempted_at: datetime
    should_send_sales_email: bool
    demo_request_id: UUID | None


@dataclass(frozen=True)
class RotationContext:
    rotation_id: UUID
    previous_tavus_api_key_id: UUID
    previous_tavus_preview_scenario_id: UUID


class TavusAdminService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    async def get_dashboard(
        self, *, preview_max_duration_seconds: int, api_key_encryption_key: str
    ) -> TavusDashboardResponse:
        now = datetime.now(timezone.utc).isoformat()
        runtime_row = (
            await self._supabase.rpc(
                "get_tavus_preview_runtime",
                {
                    "p_now": now,
                    "p_cap_duration_seconds": preview_max_duration_seconds,
                    "p_encryption_key": api_key_encryption_key,
                },
            )
        ).first()
        usage_row = (await self._supabase.rpc("get_tavus_usage_metrics")).first() or {}

        rotations = await self._supabase.select_many(
            "tavus_key_rotations",
            order="created_at.desc",
            limit=10,
        )
        recent_users = await self._supabase.select_many(
            "tavus_preview_sessions",
            select=(
                "id,started_at,ended_at,duration_seconds_estimate,"
                "demo_requests(name,email,institution,request_source)"
            ),
            order="started_at.desc",
            limit=20,
        )
        recent_denials = await self._supabase.select_many(
            "tavus_preview_denials",
            select="id,reason,attempted_at,sales_alert_sent,demo_request_id,demo_requests(name,email)",
            order="attempted_at.desc",
            limit=20,
        )

        active_key = None
        active_scenario = None
        if runtime_row is not None:
            active_key = TavusActiveKeySummary(
                tavus_api_key_id=UUID(str(runtime_row["tavus_api_key_id"])),
                api_key_label=str(runtime_row.get("api_key_label", "Active key")),
                tavus_api_key_status=str(runtime_row["tavus_api_key_status"]),
                live_seconds_remaining_estimate=int(
                    runtime_row["live_seconds_remaining_estimate"]
                ),
                low_quota_threshold_seconds=int(
                    runtime_row["low_quota_threshold_seconds"]
                ),
                low_quota_alert_sent_at=_parse_datetime(
                    runtime_row.get("low_quota_alert_sent_at")
                ),
            )
            active_scenario = TavusActiveScenarioSummary(
                tavus_preview_scenario_id=UUID(
                    str(runtime_row["tavus_preview_scenario_id"])
                ),
                persona_id=str(runtime_row["persona_id"]),
                replica_id=str(runtime_row["replica_id"]),
                scenario_status=str(runtime_row["scenario_status"]),
            )

        return TavusDashboardResponse(
            active_key=active_key,
            active_scenario=active_scenario,
            usage=TavusUsageSummary(
                total_sessions=int(usage_row.get("total_sessions", 0) or 0),
                unique_known_users=int(usage_row.get("unique_known_users", 0) or 0),
                exhausted_denial_count=int(
                    usage_row.get("exhausted_denial_count", 0) or 0
                ),
            ),
            rotations=[_parse_rotation(row) for row in rotations],
            recent_users=[_parse_recent_user(row) for row in recent_users],
            recent_denials=[_parse_recent_denial(row) for row in recent_denials],
        )

    async def begin_rotation(
        self,
        *,
        actor_email: str,
        requested_label: str | None,
        requested_replica_id: str,
    ) -> RotationContext:
        row = (
            await self._supabase.rpc(
                "begin_tavus_key_rotation",
                {
                    "p_actor_email": actor_email.strip().lower(),
                    "p_requested_label": requested_label or None,
                    "p_requested_replica_id": requested_replica_id,
                },
            )
        ).first()
        if row is None:
            raise RuntimeError("The active Tavus preview is not configured.")

        return RotationContext(
            rotation_id=UUID(str(row["rotation_id"])),
            previous_tavus_api_key_id=UUID(str(row["previous_tavus_api_key_id"])),
            previous_tavus_preview_scenario_id=UUID(
                str(row["previous_tavus_preview_scenario_id"])
            ),
        )

    async def complete_rotation(
        self,
        *,
        rotation_id: UUID,
        api_key_secret: str,
        api_key_encryption_key: str,
        label: str,
        persona_id: str,
        replica_id: str,
        minutes_total_seconds: int,
        low_quota_threshold_seconds: int,
    ) -> TavusRotateKeyResponse:
        row = (
            await self._supabase.rpc(
                "complete_tavus_key_rotation",
                {
                    "p_rotation_id": str(rotation_id),
                    "p_new_api_key_secret": api_key_secret,
                    "p_encryption_key": api_key_encryption_key,
                    "p_new_label": label,
                    "p_new_persona_id": persona_id,
                    "p_new_replica_id": replica_id,
                    "p_minutes_total_seconds": minutes_total_seconds,
                    "p_low_quota_threshold_seconds": low_quota_threshold_seconds,
                },
            )
        ).first()
        if row is None:
            raise RuntimeError("The Tavus key rotation could not be completed.")

        return TavusRotateKeyResponse(
            tavus_api_key_id=UUID(str(row["tavus_api_key_id"])),
            tavus_preview_scenario_id=UUID(str(row["tavus_preview_scenario_id"])),
            persona_id=str(row["persona_id"]),
            replica_id=str(row["replica_id"]),
            live_seconds_remaining_estimate=int(row["live_seconds_remaining_estimate"]),
            tavus_api_key_status=str(row["tavus_api_key_status"]),
        )

    async def fail_rotation(self, *, rotation_id: UUID, error_message: str) -> None:
        await self._supabase.rpc(
            "fail_tavus_key_rotation",
            {
                "p_rotation_id": str(rotation_id),
                "p_error_message": error_message[:400],
            },
        )

    async def record_exhausted_denial(
        self,
        *,
        tavus_api_key_id: UUID,
        tavus_preview_scenario_id: UUID,
        demo_request_id: UUID | None,
    ) -> ExhaustedPreviewDenial:
        row = (
            await self._supabase.rpc(
                "record_tavus_preview_denial",
                {
                    "p_tavus_api_key_id": str(tavus_api_key_id),
                    "p_tavus_preview_scenario_id": str(tavus_preview_scenario_id),
                    "p_demo_request_id": str(demo_request_id) if demo_request_id else None,
                    "p_reason": "exhausted",
                },
            )
        ).first()
        if row is None:
            raise RuntimeError("The exhausted preview denial could not be recorded.")

        return ExhaustedPreviewDenial(
            denial_id=UUID(str(row["denial_id"])),
            attempted_at=_parse_datetime(row["attempted_at"]) or datetime.now(timezone.utc),
            should_send_sales_email=bool(row.get("should_send_sales_email")),
            demo_request_id=(
                UUID(str(row["demo_request_id"])) if row.get("demo_request_id") else None
            ),
        )

    async def mark_exhausted_alert_sent(
        self,
        *,
        denial_id: UUID,
        tavus_api_key_id: UUID,
        sent_at: datetime,
    ) -> None:
        await self._supabase.rpc(
            "mark_tavus_exhausted_denial_alert_sent",
            {
                "p_denial_id": str(denial_id),
                "p_tavus_api_key_id": str(tavus_api_key_id),
                "p_sent_at": sent_at.isoformat(),
            },
        )

    async def get_demo_request(self, *, demo_request_id: UUID) -> dict[str, Any] | None:
        return await self._supabase.select_one(
            "demo_requests",
            filters={"id": f"eq.{demo_request_id}"},
        )


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _parse_rotation(row: dict[str, Any]) -> TavusRotationHistoryItem:
    return TavusRotationHistoryItem(
        rotation_id=UUID(str(row["id"])),
        status=str(row["status"]),
        actor_email=str(row["actor_email"]),
        requested_label=str(row["requested_label"]) if row.get("requested_label") else None,
        requested_replica_id=(
            str(row["requested_replica_id"]) if row.get("requested_replica_id") else None
        ),
        previous_tavus_api_key_id=(
            UUID(str(row["previous_tavus_api_key_id"]))
            if row.get("previous_tavus_api_key_id")
            else None
        ),
        previous_tavus_preview_scenario_id=(
            UUID(str(row["previous_tavus_preview_scenario_id"]))
            if row.get("previous_tavus_preview_scenario_id")
            else None
        ),
        new_tavus_api_key_id=(
            UUID(str(row["new_tavus_api_key_id"]))
            if row.get("new_tavus_api_key_id")
            else None
        ),
        new_tavus_preview_scenario_id=(
            UUID(str(row["new_tavus_preview_scenario_id"]))
            if row.get("new_tavus_preview_scenario_id")
            else None
        ),
        created_persona_id=(
            str(row["created_persona_id"]) if row.get("created_persona_id") else None
        ),
        error_message=str(row["error_message"]) if row.get("error_message") else None,
        created_at=_parse_datetime(row["created_at"]) or datetime.now(timezone.utc),
        completed_at=_parse_datetime(row.get("completed_at")),
    )


def _parse_recent_user(row: dict[str, Any]) -> TavusRecentUserItem:
    demo_request = row.get("demo_requests")
    if isinstance(demo_request, list):
        demo_request = demo_request[0] if demo_request else None

    return TavusRecentUserItem(
        preview_session_id=UUID(str(row["id"])),
        started_at=_parse_datetime(row["started_at"]) or datetime.now(timezone.utc),
        ended_at=_parse_datetime(row.get("ended_at")),
        duration_seconds_estimate=(
            int(row["duration_seconds_estimate"])
            if row.get("duration_seconds_estimate") is not None
            else None
        ),
        request_source=(
            str(demo_request["request_source"])
            if isinstance(demo_request, dict) and demo_request.get("request_source")
            else None
        ),
        name=(
            str(demo_request["name"])
            if isinstance(demo_request, dict) and demo_request.get("name")
            else None
        ),
        email=(
            str(demo_request["email"])
            if isinstance(demo_request, dict) and demo_request.get("email")
            else None
        ),
        institution=(
            str(demo_request["institution"])
            if isinstance(demo_request, dict) and demo_request.get("institution")
            else None
        ),
    )


def _parse_recent_denial(row: dict[str, Any]) -> TavusPreviewDenialItem:
    demo_request = row.get("demo_requests")
    if isinstance(demo_request, list):
        demo_request = demo_request[0] if demo_request else None

    return TavusPreviewDenialItem(
        denial_id=UUID(str(row["id"])),
        reason=str(row["reason"]),
        attempted_at=_parse_datetime(row["attempted_at"]) or datetime.now(timezone.utc),
        sales_alert_sent=bool(row["sales_alert_sent"]),
        demo_request_id=(
            UUID(str(row["demo_request_id"])) if row.get("demo_request_id") else None
        ),
        name=(
            str(demo_request["name"])
            if isinstance(demo_request, dict) and demo_request.get("name")
            else None
        ),
        email=(
            str(demo_request["email"])
            if isinstance(demo_request, dict) and demo_request.get("email")
            else None
        ),
    )
