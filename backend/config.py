from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv


_TRUE_VALUES = {"1", "true", "yes", "on"}
_FALSE_VALUES = {"0", "false", "no", "off"}
_ENV_LOADED = False


class AppConfigurationError(RuntimeError):
    """Raised when the application is missing required configuration."""


class SupabaseConfigurationError(AppConfigurationError):
    """Raised when Supabase configuration is missing or invalid."""


class TavusConfigurationError(AppConfigurationError):
    """Raised when the Tavus preview is unavailable due to local configuration."""


@dataclass(frozen=True)
class SupabaseSettings:
    mode: Literal["local", "remote"]
    url: str
    service_role_key: str
    request_timeout_seconds: float


@dataclass(frozen=True)
class TavusRuntimeSettings:
    api_base_url: str
    conversation_name: str
    require_auth: bool
    max_participants: int
    preview_cooldown_seconds: int
    request_timeout_seconds: float
    preview_max_duration_seconds: int


@dataclass(frozen=True)
class NotificationSettings:
    resend_api_key: str
    from_email: str
    admin_email: str


def load_environment() -> None:
    global _ENV_LOADED

    if _ENV_LOADED:
        return

    load_dotenv(dotenv_path=Path(__file__).with_name(".env"))
    _ENV_LOADED = True


def _read_bool(name: str, default: bool) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    normalized = raw_value.strip().lower()
    if normalized in _TRUE_VALUES:
        return True
    if normalized in _FALSE_VALUES:
        return False

    raise AppConfigurationError(f"Invalid value for {name}.")


def _read_int(name: str, default: int, minimum: int | None = None) -> int:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        value = default
    else:
        try:
            value = int(raw_value.strip())
        except ValueError as exc:
            raise AppConfigurationError(f"Invalid value for {name}.") from exc

    if minimum is not None and value < minimum:
        raise AppConfigurationError(f"Invalid value for {name}.")

    return value


def _read_float(name: str, default: float, minimum: float | None = None) -> float:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        value = default
    else:
        try:
            value = float(raw_value.strip())
        except ValueError as exc:
            raise AppConfigurationError(f"Invalid value for {name}.") from exc

    if minimum is not None and value < minimum:
        raise AppConfigurationError(f"Invalid value for {name}.")

    return value


def get_supabase_settings() -> SupabaseSettings:
    load_environment()

    raw_mode = os.getenv("SUPABASE_MODE", "local").strip().lower()
    if raw_mode not in {"local", "remote"}:
        raise SupabaseConfigurationError("Supabase is not configured correctly.")

    url = os.getenv("SUPABASE_URL", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not url or not service_role_key:
        raise SupabaseConfigurationError("Supabase is not configured yet.")

    return SupabaseSettings(
        mode=raw_mode,
        url=url,
        service_role_key=service_role_key,
        request_timeout_seconds=_read_float(
            "SUPABASE_REQUEST_TIMEOUT_SECONDS", 10.0, minimum=1.0
        ),
    )


def get_tavus_runtime_settings() -> TavusRuntimeSettings:
    load_environment()

    if not _read_bool("TAVUS_PREVIEW_ENABLED", True):
        raise TavusConfigurationError("The live preview is currently disabled.")

    return TavusRuntimeSettings(
        api_base_url=os.getenv("TAVUS_API_BASE_URL", "https://tavusapi.com/v2").strip()
        or "https://tavusapi.com/v2",
        conversation_name=os.getenv(
            "TAVUS_CONVERSATION_NAME", "DeepPatient Live Session"
        ).strip()
        or "DeepPatient Live Session",
        require_auth=_read_bool("TAVUS_PREVIEW_REQUIRE_AUTH", True),
        max_participants=_read_int("TAVUS_PREVIEW_MAX_PARTICIPANTS", 2, minimum=2),
        preview_cooldown_seconds=_read_int(
            "TAVUS_PREVIEW_COOLDOWN_SECONDS", 120, minimum=0
        ),
        request_timeout_seconds=_read_float(
            "TAVUS_REQUEST_TIMEOUT_SECONDS", 20.0, minimum=1.0
        ),
        preview_max_duration_seconds=_read_int(
            "TAVUS_PREVIEW_MAX_DURATION_SECONDS", 300, minimum=30
        ),
    )


def get_notification_settings() -> NotificationSettings:
    load_environment()

    return NotificationSettings(
        resend_api_key=os.getenv("RESEND_API_KEY", "").strip(),
        from_email=os.getenv("FROM_EMAIL", "hello@deeppatient.com").strip()
        or "hello@deeppatient.com",
        admin_email=os.getenv("ADMIN_EMAIL", "team@deeppatient.com").strip()
        or "team@deeppatient.com",
    )


def get_allowed_origins() -> list[str]:
    load_environment()

    configured_origins = os.getenv("BACKEND_CORS_ORIGINS", "").strip()
    if configured_origins:
        return [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

    return [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
