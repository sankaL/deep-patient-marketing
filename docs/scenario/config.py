SCENARIO_PERSONA_CONFIG = {
    "persona_name": "Darius Miller",
    "default_replica_id": "r4ba1277e4fb",
    "layers": {
        "llm": {
            "model": "tavus-gpt-4.1",
            "speculative_inference": True,
        },
        "perception": {
            "perception_model": "raven-1",
        },
        "conversational_flow": {
            "turn_detection_model": "sparrow-1",
            "turn_taking_patience": "medium",
            "replica_interruptibility": "low",
        },
    },
}
