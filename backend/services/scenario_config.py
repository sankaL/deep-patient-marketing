from __future__ import annotations

from dataclasses import dataclass
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
from typing import Any


SCENARIO_CONFIG_PATH = Path(__file__).resolve().parents[1] / "scenario" / "config.py"
SCENARIO_PROMPT_PATH = (
    Path(__file__).resolve().parents[1] / "scenario" / "system-prompt.md"
)


class ScenarioConfigError(RuntimeError):
    """Raised when the Tavus scenario config is missing or invalid."""


@dataclass(frozen=True)
class ScenarioPersonaConfig:
    persona_name: str
    default_replica_id: str
    layers: dict[str, Any]
    system_prompt: str


def load_scenario_persona_config() -> ScenarioPersonaConfig:
    spec = spec_from_file_location("docs_scenario_config", SCENARIO_CONFIG_PATH)
    if spec is None or spec.loader is None:
        raise ScenarioConfigError("The Tavus scenario config is unavailable.")

    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    payload = getattr(module, "SCENARIO_PERSONA_CONFIG", None)
    if not isinstance(payload, dict):
        raise ScenarioConfigError("The Tavus scenario config is invalid.")

    persona_name = str(payload.get("persona_name", "")).strip()
    default_replica_id = str(payload.get("default_replica_id", "")).strip()
    layers = payload.get("layers")
    if not persona_name or not default_replica_id or not isinstance(layers, dict):
        raise ScenarioConfigError("The Tavus scenario config is invalid.")

    try:
        system_prompt = SCENARIO_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except OSError as exc:
        raise ScenarioConfigError("The Tavus system prompt is unavailable.") from exc

    if not system_prompt:
        raise ScenarioConfigError("The Tavus system prompt is unavailable.")

    return ScenarioPersonaConfig(
        persona_name=persona_name,
        default_replica_id=default_replica_id,
        layers=layers,
        system_prompt=system_prompt,
    )
