from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class AdminSessionResponse(BaseModel):
    email: EmailStr


class TavusRotateKeyRequest(BaseModel):
    api_key: str = Field(min_length=1, max_length=500)
    label: str = Field(default="", max_length=120)


class TavusActiveKeySummary(BaseModel):
    tavus_api_key_id: UUID
    api_key_label: str
    tavus_api_key_status: str
    live_seconds_remaining_estimate: int
    low_quota_threshold_seconds: int
    low_quota_alert_sent_at: datetime | None


class TavusActiveScenarioSummary(BaseModel):
    tavus_preview_scenario_id: UUID
    persona_id: str
    replica_id: str
    scenario_status: str


class TavusUsageSummary(BaseModel):
    total_sessions: int
    unique_known_users: int
    exhausted_denial_count: int


class TavusRotationHistoryItem(BaseModel):
    rotation_id: UUID
    status: str
    actor_email: str
    requested_label: str | None
    requested_replica_id: str | None
    previous_tavus_api_key_id: UUID | None
    previous_tavus_preview_scenario_id: UUID | None
    new_tavus_api_key_id: UUID | None
    new_tavus_preview_scenario_id: UUID | None
    created_persona_id: str | None
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None


class TavusRecentUserItem(BaseModel):
    preview_session_id: UUID
    started_at: datetime
    ended_at: datetime | None
    duration_seconds_estimate: int | None
    request_source: str | None
    name: str | None
    email: str | None
    institution: str | None


class TavusPreviewDenialItem(BaseModel):
    denial_id: UUID
    reason: str
    attempted_at: datetime
    sales_alert_sent: bool
    demo_request_id: UUID | None
    name: str | None
    email: str | None


class TavusDashboardResponse(BaseModel):
    active_key: TavusActiveKeySummary | None
    active_scenario: TavusActiveScenarioSummary | None
    usage: TavusUsageSummary
    rotations: list[TavusRotationHistoryItem]
    recent_users: list[TavusRecentUserItem]
    recent_denials: list[TavusPreviewDenialItem]


class TavusRotateKeyResponse(BaseModel):
    tavus_api_key_id: UUID
    tavus_preview_scenario_id: UUID
    persona_id: str
    replica_id: str
    live_seconds_remaining_estimate: int
    tavus_api_key_status: str
