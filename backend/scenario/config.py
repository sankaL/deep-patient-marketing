SCENARIO_PERSONA_CONFIG = {
    "persona_name": "Darius Miller",
    "default_replica_id": "r4ba1277e4fb",
    "layers": {
        "llm": {
            "model": "tavus-gpt-5.2",
            "speculative_inference": True,
        },
        "stt": {
            "stt_engine": "tavus-parakeet",
        },
        "perception": {
            "perception_model": "raven-1",
        },
        "conversational_flow": {
            "turn_detection_model": "time-based",
            "turn_taking_patience": "medium",
            "replica_interruptibility": "low",
        },
    },
}
