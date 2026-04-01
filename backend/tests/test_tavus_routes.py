from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import routes.tavus as tavus_routes
from config import TavusRuntimeSettings
from dependencies import (
    get_notification_service,
    get_tavus_admin_service,
    get_tavus_preview_state_service,
)
from models.tavus import (
    TavusPreviewRuntimeState,
    TavusPreviewSessionCompletionResult,
    TavusPreviewSessionRecord,
    TavusUsageRollup,
)
from services.tavus import TavusConversationResult

from conftest import app, create_client


def _runtime_settings() -> TavusRuntimeSettings:
    return TavusRuntimeSettings(
        api_base_url="https://tavus.example.com/v2",
        conversation_name="DeepPatient Live Session",
        require_auth=True,
        max_participants=2,
        preview_cooldown_seconds=0,
        request_timeout_seconds=20.0,
        preview_max_duration_seconds=300,
        api_key_encryption_key="encryption-key",
    )


def _runtime_state() -> TavusPreviewRuntimeState:
    return TavusPreviewRuntimeState(
        tavus_api_key_id=uuid4(),
        api_key_secret="secret",
        api_key_label="Primary key",
        tavus_api_key_status="active",
        live_seconds_remaining_estimate=1200,
        low_quota_threshold_seconds=300,
        low_quota_alert_sent_at=None,
        tavus_preview_scenario_id=uuid4(),
        persona_id="persona_123",
        replica_id="replica_456",
        scenario_status="active",
    )


class FakeNotificationService:
    def __init__(self, *, exhausted_sent: bool = True) -> None:
        self.exhausted_sent = exhausted_sent
        self.exhausted_alert_calls = 0

    async def send_low_quota_alert(self, *, key_label: str, rollup: TavusUsageRollup):
        return SimpleNamespace(sent=False, sent_at=None)

    async def send_exhausted_capacity_alert(
        self,
        *,
        key_label: str,
        attempted_at,
        request_name,
        request_email,
        request_institution,
    ):
        self.exhausted_alert_calls += 1
        return SimpleNamespace(
            sent=self.exhausted_sent,
            sent_at=datetime.now(timezone.utc) if self.exhausted_sent else None,
        )


class FakeTavusPreviewStateService:
    def __init__(self, runtime_state: TavusPreviewRuntimeState | None) -> None:
        self._runtime_state = runtime_state
        self.preview_session_id = uuid4()
        self.fail_create_preview_session = False

    async def close_expired_preview_sessions(self, *, preview_max_duration_seconds: int):
        return []

    async def get_runtime_state(
        self, *, preview_max_duration_seconds: int, api_key_encryption_key: str
    ):
        return self._runtime_state

    async def create_preview_session(
        self, *, runtime_state, conversation_id: str, demo_request_id
    ):
        if self.fail_create_preview_session:
            raise tavus_routes.SupabaseRestError("db failed")
        return TavusPreviewSessionRecord(
            preview_session_id=self.preview_session_id,
            tavus_api_key_id=runtime_state.tavus_api_key_id,
        )

    async def complete_preview_session(
        self,
        *,
        preview_session_id,
        end_reason,
        preview_max_duration_seconds: int,
    ):
        return TavusPreviewSessionCompletionResult(
            preview_session_id=preview_session_id,
            already_completed=False,
            duration_seconds_estimate=149,
            end_reason=end_reason,
            rollup=TavusUsageRollup(
                tavus_api_key_id=uuid4(),
                tavus_api_key_status="active",
                seconds_remaining_estimate=451,
                low_quota_threshold_seconds=300,
                low_quota_alert_sent_at=None,
            ),
        )

    async def mark_low_quota_alert_sent(self, *, tavus_api_key_id, sent_at: datetime):
        return None


class FakeTavusAdminService:
    def __init__(self, *, should_send_sales_email_sequence: list[bool] | None = None) -> None:
        self.exhausted_denials = 0
        self.should_send_sales_email_sequence = should_send_sales_email_sequence or [True]
        self.marked_exhausted_alerts: list[tuple[object, object, object]] = []

    async def record_exhausted_denial(
        self,
        *,
        tavus_api_key_id,
        tavus_preview_scenario_id,
        demo_request_id,
    ):
        self.exhausted_denials += 1
        should_send_sales_email = self.should_send_sales_email_sequence.pop(0)
        return SimpleNamespace(
            denial_id=uuid4(),
            attempted_at=datetime.utcnow(),
            should_send_sales_email=should_send_sales_email,
            demo_request_id=demo_request_id,
        )

    async def get_demo_request(self, *, demo_request_id):
        return {"name": "Jane", "email": "jane@example.com", "institution": "DPU"}

    async def mark_exhausted_alert_sent(
        self, *, denial_id, tavus_api_key_id, sent_at
    ) -> None:
        self.marked_exhausted_alerts.append((denial_id, tavus_api_key_id, sent_at))


async def _fake_create_conversation(runtime_state, settings):
    return TavusConversationResult(
        conversation_id="conversation_123",
        conversation_url="https://video.example.com/room",
        status="active",
    )


async def _fake_delete_conversation(runtime_state, settings, *, conversation_id: str):
    return None


def test_start_tavus_conversation_returns_preview_session_id(monkeypatch):
    fake_state_service = FakeTavusPreviewStateService(_runtime_state())
    fake_admin_service = FakeTavusAdminService()
    app.dependency_overrides[get_tavus_preview_state_service] = lambda: fake_state_service
    app.dependency_overrides[get_tavus_admin_service] = lambda: fake_admin_service
    app.dependency_overrides[get_notification_service] = (
        lambda: FakeNotificationService()
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)
    monkeypatch.setattr(tavus_routes, "create_conversation", _fake_create_conversation)
    monkeypatch.setattr(tavus_routes, "delete_conversation", _fake_delete_conversation)

    try:
        client = create_client()
        response = client.post(
            "/api/tavus/conversation",
            json={"demo_request_id": str(uuid4())},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    payload = response.json()
    assert payload["conversation_id"] == "conversation_123"
    assert payload["preview_session_id"] == str(fake_state_service.preview_session_id)


def test_start_tavus_conversation_fails_closed_without_active_runtime(monkeypatch):
    app.dependency_overrides[get_tavus_admin_service] = lambda: FakeTavusAdminService()
    app.dependency_overrides[get_tavus_preview_state_service] = (
        lambda: FakeTavusPreviewStateService(None)
    )
    app.dependency_overrides[get_notification_service] = (
        lambda: FakeNotificationService()
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)
    monkeypatch.setattr(tavus_routes, "create_conversation", _fake_create_conversation)
    monkeypatch.setattr(tavus_routes, "delete_conversation", _fake_delete_conversation)

    try:
        client = create_client()
        response = client.post("/api/tavus/conversation", json={})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["detail"] == "The live preview is not configured yet."


def test_complete_preview_session_returns_duration(monkeypatch):
    app.dependency_overrides[get_tavus_admin_service] = lambda: FakeTavusAdminService()
    app.dependency_overrides[get_tavus_preview_state_service] = (
        lambda: FakeTavusPreviewStateService(_runtime_state())
    )
    app.dependency_overrides[get_notification_service] = (
        lambda: FakeNotificationService()
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)

    preview_session_id = uuid4()

    try:
        client = create_client()
        response = client.post(
            f"/api/tavus/preview-sessions/{preview_session_id}/complete",
            json={"end_reason": "client_closed"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["preview_session_id"] == str(preview_session_id)
    assert payload["duration_seconds_estimate"] == 149


def test_start_tavus_conversation_cleans_up_tavus_conversation_on_db_failure(
    monkeypatch,
):
    fake_state_service = FakeTavusPreviewStateService(_runtime_state())
    fake_state_service.fail_create_preview_session = True
    cleanup_calls: list[str] = []

    async def _record_delete(runtime_state, settings, *, conversation_id: str):
        cleanup_calls.append(conversation_id)

    app.dependency_overrides[get_tavus_preview_state_service] = lambda: fake_state_service
    app.dependency_overrides[get_tavus_admin_service] = lambda: FakeTavusAdminService()
    app.dependency_overrides[get_notification_service] = (
        lambda: FakeNotificationService()
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)
    monkeypatch.setattr(tavus_routes, "create_conversation", _fake_create_conversation)
    monkeypatch.setattr(tavus_routes, "delete_conversation", _record_delete)

    try:
        client = create_client()
        response = client.post("/api/tavus/conversation", json={})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert cleanup_calls == ["conversation_123"]


def test_start_tavus_conversation_returns_exhausted_message(monkeypatch):
    runtime_state = _runtime_state()
    runtime_state = TavusPreviewRuntimeState(
        tavus_api_key_id=runtime_state.tavus_api_key_id,
        api_key_secret=runtime_state.api_key_secret,
        api_key_label=runtime_state.api_key_label,
        tavus_api_key_status="exhausted",
        live_seconds_remaining_estimate=0,
        low_quota_threshold_seconds=runtime_state.low_quota_threshold_seconds,
        low_quota_alert_sent_at=runtime_state.low_quota_alert_sent_at,
        tavus_preview_scenario_id=runtime_state.tavus_preview_scenario_id,
        persona_id=runtime_state.persona_id,
        replica_id=runtime_state.replica_id,
        scenario_status=runtime_state.scenario_status,
    )
    fake_admin_service = FakeTavusAdminService()
    fake_notifications = FakeNotificationService()
    app.dependency_overrides[get_tavus_preview_state_service] = (
        lambda: FakeTavusPreviewStateService(runtime_state)
    )
    app.dependency_overrides[get_tavus_admin_service] = lambda: fake_admin_service
    app.dependency_overrides[get_notification_service] = (
        lambda: fake_notifications
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)

    try:
        client = create_client()
        response = client.post("/api/tavus/conversation", json={})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["detail"] == tavus_routes.EXHAUSTED_PREVIEW_MESSAGE
    assert fake_admin_service.exhausted_denials == 1
    assert fake_notifications.exhausted_alert_calls == 1
    assert len(fake_admin_service.marked_exhausted_alerts) == 1


def test_repeated_exhausted_attempts_do_not_resend_alert(monkeypatch):
    runtime_state = _runtime_state()
    runtime_state = TavusPreviewRuntimeState(
        tavus_api_key_id=runtime_state.tavus_api_key_id,
        api_key_secret=runtime_state.api_key_secret,
        api_key_label=runtime_state.api_key_label,
        tavus_api_key_status="exhausted",
        live_seconds_remaining_estimate=0,
        low_quota_threshold_seconds=runtime_state.low_quota_threshold_seconds,
        low_quota_alert_sent_at=runtime_state.low_quota_alert_sent_at,
        tavus_preview_scenario_id=runtime_state.tavus_preview_scenario_id,
        persona_id=runtime_state.persona_id,
        replica_id=runtime_state.replica_id,
        scenario_status=runtime_state.scenario_status,
    )
    fake_admin_service = FakeTavusAdminService(
        should_send_sales_email_sequence=[True, False]
    )
    fake_notifications = FakeNotificationService()

    app.dependency_overrides[get_tavus_preview_state_service] = (
        lambda: FakeTavusPreviewStateService(runtime_state)
    )
    app.dependency_overrides[get_tavus_admin_service] = lambda: fake_admin_service
    app.dependency_overrides[get_notification_service] = (
        lambda: fake_notifications
    )
    monkeypatch.setattr(tavus_routes, "get_tavus_runtime_config", _runtime_settings)

    try:
        client = create_client()
        first_response = client.post("/api/tavus/conversation", json={})
        second_response = client.post("/api/tavus/conversation", json={})
    finally:
        app.dependency_overrides.clear()

    assert first_response.status_code == 503
    assert second_response.status_code == 503
    assert fake_admin_service.exhausted_denials == 2
    assert fake_notifications.exhausted_alert_calls == 1
    assert len(fake_admin_service.marked_exhausted_alerts) == 1
