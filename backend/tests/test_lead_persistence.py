from __future__ import annotations

import asyncio
from uuid import uuid4

from models.public import DemoRequest, PricingInquiryRequest
from services.leads import LeadService


class RecordingSupabaseClient:
    def __init__(self) -> None:
        self.relation: str | None = None
        self.payload: dict[str, object] | None = None

    async def insert_one(self, relation: str, payload: dict[str, object]):
        self.relation = relation
        self.payload = payload
        return {"id": str(uuid4())}


def test_demo_leads_are_always_persisted_as_book_demo():
    client = RecordingSupabaseClient()
    service = LeadService(client)  # type: ignore[arg-type]

    asyncio.run(
        service.capture_demo_request(
            DemoRequest(
                name="Jane Smith",
                email="jane@example.com",
                institution="DeepPatient University",
                team_size_text="51–150",
            )
        )
    )

    assert client.relation == "demo_requests"
    assert client.payload is not None
    assert client.payload["request_source"] == "book_demo"


def test_pricing_leads_are_persisted_to_pricing_requests():
    client = RecordingSupabaseClient()
    service = LeadService(client)  # type: ignore[arg-type]

    asyncio.run(
        service.capture_pricing_request(
            PricingInquiryRequest(
                firstName="Jane",
                lastName="Smith",
                email="jane@example.com",
                institution="DeepPatient University",
                orgSize="51–150",
                source="Conference",
                message="We are evaluating pilots.",
            )
        )
    )

    assert client.relation == "pricing_requests"
    assert client.payload is not None
    assert client.payload["first_name"] == "Jane"
    assert client.payload["last_name"] == "Smith"
    assert client.payload["email"] == "jane@example.com"
    assert client.payload["institution"] == "DeepPatient University"
    assert client.payload["org_size_bucket"] == "51–150"
    assert client.payload["source"] == "Conference"
    assert client.payload["message"] == "We are evaluating pilots."


def test_supabase_client_init_with_database_url():
    from config import SupabaseSettings
    from services.supabase_client import SupabaseRestClient

    settings = SupabaseSettings(
        url="",
        service_role_key="",
        request_timeout_seconds=5.0,
        database_url="postgresql://user:pass@localhost:5432/db",
    )
    client = SupabaseRestClient(settings)
    assert client._database_url == "postgresql://user:pass@localhost:5432/db"
