from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import routes.admin as admin_routes
from config import AdminAuthSettings, TavusRuntimeSettings
from dependencies import get_admin_auth_service, get_tavus_admin_service
from models.admin import TavusDashboardResponse, TavusUsageSummary
from services.admin_auth import AdminAuthError, AdminSession
from services.scenario_config import ScenarioPersonaConfig

from conftest import app, create_client


def _auth_settings() -> AdminAuthSettings:
    return AdminAuthSettings(
        auth_url="https://supabase.example.com/auth/v1",
        anon_key="anon",
        allowed_admin_emails=("admin@example.com",),
        access_cookie_name="dp_admin_access_token",
        refresh_cookie_name="dp_admin_refresh_token",
        cookie_secure=False,
        cookie_domain=None,
        cookie_same_site="lax",
        refresh_slack_seconds=60,
    )


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


@dataclass
class FakeAdminAuthService:
    fail_login: bool = False
    fail_get_user: bool = False

    def __post_init__(self) -> None:
        self.settings = _auth_settings()

    async def login(self, *, email: str, password: str) -> AdminSession:
        if self.fail_login:
            raise AdminAuthError("Incorrect email or password.", status_code=401)
        return AdminSession(
            access_token="access-token",
            refresh_token="refresh-token",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            email=email.lower(),
        )

    async def refresh(self, *, refresh_token: str) -> AdminSession:
        return AdminSession(
            access_token="fresh-access-token",
            refresh_token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            email="admin@example.com",
        )

    async def get_user_email(self, *, access_token: str) -> str:
        if self.fail_get_user:
            raise AdminAuthError("Please sign in to continue.", status_code=401)
        return "admin@example.com"

    def is_allowed_admin_email(self, email: str) -> bool:
        return email.lower() in self.settings.allowed_admin_emails


class FakeTavusAdminService:
    def __init__(self) -> None:
        self.begin_called = False

    async def get_dashboard(
        self, *, preview_max_duration_seconds: int, api_key_encryption_key: str
    ):
        return TavusDashboardResponse(
            active_key=None,
            active_scenario=None,
            usage=TavusUsageSummary(
                total_sessions=0,
                unique_known_users=0,
                exhausted_denial_count=0,
            ),
            rotations=[],
            recent_users=[],
            recent_denials=[],
        )

    async def begin_rotation(
        self, *, actor_email: str, requested_label: str | None, requested_replica_id: str
    ):
        self.begin_called = True
        return SimpleNamespace(
            rotation_id=uuid4(),
            previous_tavus_api_key_id=uuid4(),
            previous_tavus_preview_scenario_id=uuid4(),
        )

    async def complete_rotation(
        self,
        *,
        rotation_id,
        api_key_secret: str,
        api_key_encryption_key: str,
        label: str,
        persona_id: str,
        replica_id: str,
        minutes_total_seconds: int,
        low_quota_threshold_seconds: int,
    ):
        return {
            "tavus_api_key_id": str(uuid4()),
            "tavus_preview_scenario_id": str(uuid4()),
            "persona_id": persona_id,
            "replica_id": replica_id,
            "live_seconds_remaining_estimate": minutes_total_seconds,
            "tavus_api_key_status": "active",
        }

    async def fail_rotation(self, *, rotation_id, error_message: str) -> None:
        return None


async def _fake_create_persona(*, api_key: str, settings, persona_config):
    return SimpleNamespace(persona_id="persona_123")


def _fake_scenario_config() -> ScenarioPersonaConfig:
    return ScenarioPersonaConfig(
        persona_name="Darius Miller",
        default_replica_id="r4ba1277e4fb",
        layers={"llm": {"model": "tavus-gpt-4.1"}},
        system_prompt="prompt",
    )


def test_admin_login_sets_session_cookie():
    app.dependency_overrides[get_admin_auth_service] = lambda: FakeAdminAuthService()

    try:
        client = create_client()
        response = client.post(
            "/api/admin/auth/login",
            json={"email": "admin@example.com", "password": "secret"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["email"] == "admin@example.com"
    assert "dp_admin_access_token=" in response.headers["set-cookie"]


def test_admin_session_requires_sign_in():
    app.dependency_overrides[get_admin_auth_service] = lambda: FakeAdminAuthService(
        fail_get_user=True
    )

    try:
        client = create_client()
        response = client.get("/api/admin/auth/session")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 401
    assert response.json()["detail"] == "Please sign in to continue."


def test_admin_dashboard_returns_payload(monkeypatch):
    app.dependency_overrides[get_admin_auth_service] = lambda: FakeAdminAuthService()
    app.dependency_overrides[get_tavus_admin_service] = lambda: FakeTavusAdminService()

    try:
        client = create_client()
        client.cookies.set("dp_admin_access_token", "access-token")
        response = client.get("/api/admin/tavus/dashboard")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["usage"]["total_sessions"] == 0


def test_admin_rotate_key_uses_fixed_replica(monkeypatch):
    fake_tavus_admin = FakeTavusAdminService()
    app.dependency_overrides[get_admin_auth_service] = lambda: FakeAdminAuthService()
    app.dependency_overrides[get_tavus_admin_service] = lambda: fake_tavus_admin
    monkeypatch.setattr(admin_routes, "get_tavus_runtime_config", _runtime_settings)
    monkeypatch.setattr(admin_routes, "load_scenario_persona_config", _fake_scenario_config)
    monkeypatch.setattr(admin_routes, "create_persona", _fake_create_persona)

    try:
        client = create_client()
        client.cookies.set("dp_admin_access_token", "access-token")
        response = client.post(
            "/api/admin/tavus/rotate",
            json={"api_key": "next-key", "label": "April rotation"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["persona_id"] == "persona_123"
    assert payload["replica_id"] == "r4ba1277e4fb"
