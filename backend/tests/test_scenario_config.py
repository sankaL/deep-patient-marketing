from __future__ import annotations

from services.scenario_config import load_scenario_persona_config


def test_load_scenario_persona_config_uses_packaged_files():
    config = load_scenario_persona_config()

    assert config.persona_name == "Darius Miller"
    assert config.default_replica_id == "r4ba1277e4fb"
    assert config.layers["llm"]["model"] == "tavus-gpt-4.1"
    assert "I just... I feel like I'm stuck in a fog" in config.system_prompt
