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
    anon_key: str
    service_role_key: str
    request_timeout_seconds: float


@dataclass(frozen=True)
class AdminAuthSettings:
    auth_url: str
    anon_key: str
    allowed_admin_emails: tuple[str, ...]
    access_cookie_name: str
    refresh_cookie_name: str
    cookie_secure: bool
    cookie_domain: str | None
    cookie_same_site: Literal["lax", "strict", "none"]
    refresh_slack_seconds: int


@dataclass(frozen=True)
class TavusRuntimeSettings:
    api_base_url: str
    conversation_name: str
    require_auth: bool
    max_participants: int
    preview_cooldown_seconds: int
    request_timeout_seconds: float
    preview_max_duration_seconds: int
    api_key_encryption_key: str


@dataclass(frozen=True)
class NotificationSettings:
    resend_api_key: str
    from_email: str
    admin_email: str
    sales_email: str
    product_video_url: str
    marketing_site_url: str


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
    anon_key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not url or not service_role_key:
        raise SupabaseConfigurationError("Supabase is not configured yet.")

    return SupabaseSettings(
        mode=raw_mode,
        url=url,
        anon_key=anon_key or service_role_key,
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
        api_key_encryption_key=os.getenv("TAVUS_API_KEY_ENCRYPTION_KEY", "").strip()
        or (_raise_tavus_encryption_error()),
    )


def _raise_tavus_encryption_error() -> str:
    raise TavusConfigurationError("The Tavus API key encryption secret is not configured.")


def get_notification_settings() -> NotificationSettings:
    load_environment()

    return NotificationSettings(
        resend_api_key=os.getenv("RESEND_API_KEY", "").strip(),
        from_email=os.getenv("FROM_EMAIL", "sales@deeppatient.io").strip()
        or "sales@deeppatient.io",
        admin_email=os.getenv("ADMIN_EMAIL", "team@deeppatient.com").strip()
        or "team@deeppatient.com",
        sales_email=os.getenv("SALES_EMAIL", "sales@deeppatient.io").strip()
        or "sales@deeppatient.io",
        product_video_url=os.getenv(
            "PRODUCT_VIDEO_URL",
            (
                "https://www.dropbox.com/scl/fi/q9tyd47c6g67drz4nourk/"
                "DeepPatient-Demo-Vid-light-HQ.mp4"
                "?rlkey=m27fmkw4dhethlzii5e201yb4&st=r48c1uc6&raw=1"
            ),
        ).strip(),
        marketing_site_url=os.getenv(
            "MARKETING_SITE_URL", "https://deeppatient.io"
        ).strip()
        or "https://deeppatient.io",
    )


def get_admin_auth_settings() -> AdminAuthSettings:
    load_environment()

    auth_url = (
        os.getenv("SUPABASE_AUTH_URL", "").strip()
        or os.getenv("SUPABASE_URL", "").strip()
    )
    anon_key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not auth_url or not anon_key:
        raise SupabaseConfigurationError("Supabase auth is not configured yet.")

    if not auth_url.rstrip("/").endswith("/auth/v1"):
        auth_url = f"{auth_url.rstrip('/')}/auth/v1"

    raw_allowed_emails = os.getenv("ADMIN_EMAILS", "").strip()
    if raw_allowed_emails:
        allowed_admin_emails = tuple(
            email.strip().lower()
            for email in raw_allowed_emails.split(",")
            if email.strip()
        )
    else:
        fallback = os.getenv("ADMIN_EMAIL", "").strip().lower()
        allowed_admin_emails = (fallback,) if fallback else ()

    if not allowed_admin_emails:
        raise SupabaseConfigurationError("Admin auth is not configured yet.")

    same_site = os.getenv("ADMIN_AUTH_COOKIE_SAME_SITE", "lax").strip().lower()
    if same_site not in {"lax", "strict", "none"}:
        raise SupabaseConfigurationError("Admin auth is not configured correctly.")

    raw_cookie_domain = os.getenv("ADMIN_AUTH_COOKIE_DOMAIN")
    cookie_domain = raw_cookie_domain.strip() if raw_cookie_domain else None

    return AdminAuthSettings(
        auth_url=auth_url,
        anon_key=anon_key,
        allowed_admin_emails=allowed_admin_emails,
        access_cookie_name=os.getenv(
            "ADMIN_AUTH_ACCESS_COOKIE_NAME", "dp_admin_access_token"
        ).strip()
        or "dp_admin_access_token",
        refresh_cookie_name=os.getenv(
            "ADMIN_AUTH_REFRESH_COOKIE_NAME", "dp_admin_refresh_token"
        ).strip()
        or "dp_admin_refresh_token",
        cookie_secure=_read_bool("ADMIN_AUTH_COOKIE_SECURE", False),
        cookie_domain=cookie_domain or None,
        cookie_same_site=same_site,
        refresh_slack_seconds=_read_int(
            "ADMIN_AUTH_REFRESH_SLACK_SECONDS", 60, minimum=0
        ),
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
