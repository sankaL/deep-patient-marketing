from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


_ENV_LOADED = False


class AppConfigurationError(RuntimeError):
    """Raised when required application configuration is missing or invalid."""


class SupabaseConfigurationError(AppConfigurationError):
    """Raised when Supabase lead persistence is unavailable."""


@dataclass(frozen=True)
class SupabaseSettings:
    url: str
    service_role_key: str
    request_timeout_seconds: float
    database_url: str | None = None


@dataclass(frozen=True)
class NotificationSettings:
    resend_api_key: str
    from_email: str
    sales_email: str
    product_video_url: str


def load_environment() -> None:
    global _ENV_LOADED

    if _ENV_LOADED:
        return

    load_dotenv(dotenv_path=Path(__file__).with_name(".env"))
    _ENV_LOADED = True


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

    database_url = os.getenv("DATABASE_URL", "").strip() or None
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    if not database_url and (not url or not service_role_key):
        raise SupabaseConfigurationError("Supabase is not configured yet.")

    return SupabaseSettings(
        url=url,
        service_role_key=service_role_key,
        database_url=database_url,
        request_timeout_seconds=_read_float(
            "SUPABASE_REQUEST_TIMEOUT_SECONDS", 10.0, minimum=1.0
        ),
    )


def get_notification_settings() -> NotificationSettings:
    load_environment()

    return NotificationSettings(
        resend_api_key=os.getenv("RESEND_API_KEY", "").strip(),
        from_email=os.getenv("FROM_EMAIL", "sales@deeppatient.io").strip()
        or "sales@deeppatient.io",
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
    )


def get_allowed_origins() -> list[str]:
    load_environment()

    configured_origins = os.getenv("BACKEND_CORS_ORIGINS", "").strip()
    if configured_origins:
        return [
            origin.strip()
            for origin in configured_origins.split(",")
            if origin.strip()
        ]

    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
