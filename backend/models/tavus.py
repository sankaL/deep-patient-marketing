from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


PreviewSessionEndReason = Literal[
    "client_closed",
    "window_unload",
    "timeout",
    "error",
    "abandoned",
]


@dataclass(frozen=True)
class TavusPreviewRuntimeState:
    tavus_api_key_id: UUID
    api_key_secret: str
    api_key_label: str
    tavus_api_key_status: str
    live_seconds_remaining_estimate: int
    low_quota_threshold_seconds: int
    low_quota_alert_sent_at: datetime | None
    tavus_preview_scenario_id: UUID
    persona_id: str
    replica_id: str
    scenario_status: str


@dataclass(frozen=True)
class TavusPreviewSessionRecord:
    preview_session_id: UUID
    tavus_api_key_id: UUID


@dataclass(frozen=True)
class TavusUsageRollup:
    tavus_api_key_id: UUID
    tavus_api_key_status: str
    seconds_remaining_estimate: int
    low_quota_threshold_seconds: int
    low_quota_alert_sent_at: datetime | None


@dataclass(frozen=True)
class TavusPreviewSessionCompletionResult:
    preview_session_id: UUID
    already_completed: bool
    duration_seconds_estimate: int
    end_reason: PreviewSessionEndReason
    rollup: TavusUsageRollup


class TavusConversationRequestBody(BaseModel):
    demo_request_id: UUID | None = None


class TavusConversationResponse(BaseModel):
    conversation_id: str
    conversation_url: str
    status: str
    preview_session_id: UUID


class TavusPreviewSessionCompleteRequest(BaseModel):
    end_reason: PreviewSessionEndReason = "client_closed"


class TavusPreviewSessionCompleteResponse(BaseModel):
    preview_session_id: UUID
    already_completed: bool
    duration_seconds_estimate: int
    end_reason: PreviewSessionEndReason
