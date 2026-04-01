from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from models.public import DemoRequest, PricingInquiryRequest
from services.supabase_client import SupabaseRestClient


@dataclass(frozen=True)
class CapturedLead:
    request_id: UUID


class LeadService:
    def __init__(self, supabase: SupabaseRestClient) -> None:
        self._supabase = supabase

    async def capture_demo_request(self, payload: DemoRequest) -> CapturedLead:
        row = await self._supabase.insert_one(
            "demo_requests",
            {
                "name": payload.name.strip(),
                "email": str(payload.email).strip(),
                "institution": payload.institution.strip() or None,
                "team_size_text": payload.team_size_text.strip() or None,
                "request_source": payload.request_source,
            },
        )
        return CapturedLead(request_id=UUID(str(row["id"])))

    async def capture_pricing_request(
        self, payload: PricingInquiryRequest
    ) -> CapturedLead:
        row = await self._supabase.insert_one(
            "pricing_requests",
            {
                "first_name": payload.first_name.strip(),
                "last_name": payload.last_name.strip(),
                "email": str(payload.email).strip(),
                "institution": payload.institution.strip(),
                "org_size_bucket": payload.org_size_bucket,
                "source": payload.source.strip() or None,
                "message": payload.message.strip() or None,
            },
        )
        return CapturedLead(request_id=UUID(str(row["id"])))
