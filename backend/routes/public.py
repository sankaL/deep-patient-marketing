from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_lead_service, get_notification_service
from models.public import (
    BasicSuccessResponse,
    DemoRequest,
    DemoRequestResponse,
    PricingInquiryRequest,
    PricingInquiryResponse,
    SubscribeRequest,
)
from services.leads import LeadService
from services.notifications import NotificationService
from services.supabase_client import SupabaseRestError


logger = logging.getLogger(__name__)
router = APIRouter(tags=["public"])


@router.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "deeppatient-marketing"}


@router.post("/api/subscribe", response_model=BasicSuccessResponse)
async def subscribe(
    payload: SubscribeRequest,
    notifications: NotificationService = Depends(get_notification_service),
) -> BasicSuccessResponse:
    try:
        await notifications.send_newsletter_welcome(str(payload.email))
    except Exception:
        logger.exception("Newsletter welcome email failed.")

    return BasicSuccessResponse(success=True, message="Subscribed successfully")


@router.post("/api/demo-request", response_model=DemoRequestResponse)
async def demo_request(
    payload: DemoRequest,
    leads: LeadService = Depends(get_lead_service),
    notifications: NotificationService = Depends(get_notification_service),
) -> DemoRequestResponse:
    try:
        captured = await leads.capture_demo_request(payload)
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="We could not capture your request right now. Please try again later.",
        ) from exc

    try:
        await notifications.send_demo_request_notifications(payload)
    except Exception:
        logger.exception(
            "Demo request notifications failed.",
            extra={
                "request_id": str(captured.request_id),
                "request_source": payload.request_source,
            },
        )

    return DemoRequestResponse(
        success=True,
        message="Your request has been received.",
        request_id=captured.request_id,
    )


@router.post("/api/pricing-inquiry", response_model=PricingInquiryResponse)
async def pricing_inquiry(
    payload: PricingInquiryRequest,
    leads: LeadService = Depends(get_lead_service),
    notifications: NotificationService = Depends(get_notification_service),
) -> PricingInquiryResponse:
    try:
        captured = await leads.capture_pricing_request(payload)
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="We could not capture your pricing request right now. Please try again later.",
        ) from exc

    try:
        await notifications.send_pricing_inquiry_notification(payload)
    except Exception:
        logger.exception(
            "Pricing inquiry notification failed.",
            extra={"request_id": str(captured.request_id)},
        )

    return PricingInquiryResponse(
        success=True,
        message="Your pricing inquiry has been received.",
        request_id=captured.request_id,
    )
