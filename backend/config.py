from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


_TRUE_VALUES = {"1", "true", "yes", "on"}
_FALSE_VALUES = {"0", "false", "no", "off"}
_ENV_LOADED = False


class TavusConfigurationError(RuntimeError):
    """Raised when the Tavus preview is unavailable due to local configuration."""


@dataclass(frozen=True)
class TavusSettings:
    api_key: str
    persona_id: str
    replica_id: str
    api_base_url: str
    conversation_name: str
    require_auth: bool
    max_participants: int
    preview_cooldown_seconds: int
    request_timeout_seconds: float
    test_mode: bool


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

    raise TavusConfigurationError(f"Invalid value for {name}.")


def _read_int(name: str, default: int, minimum: int | None = None) -> int:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        value = default
    else:
        try:
            value = int(raw_value.strip())
        except ValueError as exc:
            raise TavusConfigurationError(f"Invalid value for {name}.") from exc

    if minimum is not None and value < minimum:
        raise TavusConfigurationError(f"Invalid value for {name}.")

    return value


def _read_float(name: str, default: float, minimum: float | None = None) -> float:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        value = default
    else:
        try:
            value = float(raw_value.strip())
        except ValueError as exc:
            raise TavusConfigurationError(f"Invalid value for {name}.") from exc

    if minimum is not None and value < minimum:
        raise TavusConfigurationError(f"Invalid value for {name}.")

    return value


def get_tavus_settings() -> TavusSettings:
    load_environment()

    if not _read_bool("TAVUS_PREVIEW_ENABLED", True):
        raise TavusConfigurationError("The live preview is currently disabled.")

    api_key = os.getenv("TAVUS_API_KEY", "").strip()
    persona_id = os.getenv("TAVUS_PERSONA_ID", "").strip()
    replica_id = os.getenv("TAVUS_REPLICA_ID", "").strip()

    if not api_key or not persona_id or not replica_id:
        raise TavusConfigurationError("The live preview is not configured yet.")

    return TavusSettings(
        api_key=api_key,
        persona_id=persona_id,
        replica_id=replica_id,
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
        test_mode=_read_bool("TAVUS_PREVIEW_TEST_MODE", False),
    )