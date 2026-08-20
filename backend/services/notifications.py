from __future__ import annotations

import asyncio
import logging
from email.utils import parseaddr

from config import NotificationSettings
from models.public import DemoRequest, PricingInquiryRequest
from services.email_templates import EmailSection, render_marketing_email

try:
    import resend
except ImportError:  # pragma: no cover - optional dependency in local dev
    resend = None  # type: ignore


logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, settings: NotificationSettings) -> None:
        self._settings = settings
        if resend and settings.resend_api_key:
            resend.api_key = settings.resend_api_key

    def _send(
        self,
        *,
        subject: str,
        to: list[str],
        html_body: str,
        text_body: str,
        reply_to: list[str] | None = None,
    ) -> bool:
        if not resend or not self._settings.resend_api_key:
            raise RuntimeError("Resend is not configured.")

        from_header = self._format_from_header()
        payload = {
            "from": from_header,
            "to": to,
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        if reply_to:
            payload["reply_to"] = reply_to

        log_context = {
            "subject": subject,
            "from_domain": _email_domain(from_header),
            "recipient_count": len(to),
            "recipient_domains": _email_domains(to),
            "reply_to_domains": _email_domains(reply_to or []),
        }

        try:
            response = resend.Emails.send(payload)
        except Exception:
            logger.exception("Resend email send failed.", extra=log_context)
            raise

        message_id = (
            response.get("id")
            if isinstance(response, dict) and isinstance(response.get("id"), str)
            else None
        )
        logger.info(
            "Resend email sent.",
            extra={**log_context, "message_id": message_id},
        )
        return True

    def _format_from_header(self) -> str:
        from_email = self._settings.from_email.strip()
        if "<" in from_email and ">" in from_email:
            return from_email
        return f"DeepPatient <{from_email}>"

    async def send_demo_request_notifications(self, payload: DemoRequest) -> None:
        name = payload.name.strip()
        email = str(payload.email).strip()
        institution = payload.institution.strip() or "N/A"
        team_size = payload.team_size_text.strip() or "N/A"

        sales_message = render_marketing_email(
            self._settings,
            eyebrow="Sales Lead",
            title="New demo request",
            intro="A visitor submitted a Book a Demo request on the marketing site.",
            sections=[
                EmailSection(label="Name", value=name),
                EmailSection(label="Email", value=email),
                EmailSection(label="Institution", value=institution),
                EmailSection(label="Team size", value=team_size),
                EmailSection(label="Source", value="Book demo"),
            ],
            closing="Send a follow-up from the sales inbox when you're ready.",
        )

        await asyncio.to_thread(
            self._send,
            subject=f"New demo request - {name}",
            to=[self._settings.sales_email],
            html_body=sales_message.html,
            text_body=sales_message.text,
        )

        customer_message = render_marketing_email(
            self._settings,
            eyebrow="Request received",
            title=f"Thanks, {name}",
            intro=(
                "We've got your demo request. While our team reviews it, here is the "
                "DeepPatient walkthrough video you can review or share with your team."
            ),
            cta_label="Watch the DeepPatient walkthrough",
            cta_url=self._settings.product_video_url,
            closing="The DeepPatient team will follow up shortly.",
        )
        await asyncio.to_thread(
            self._send,
            subject="We received your DeepPatient demo request",
            to=[email],
            html_body=customer_message.html,
            text_body=customer_message.text,
            reply_to=[self._settings.sales_email],
        )

    async def send_pricing_inquiry_notification(
        self, payload: PricingInquiryRequest
    ) -> None:
        full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}".strip()
        email = str(payload.email).strip()
        institution = payload.institution.strip()
        source = payload.source.strip() or "N/A"
        message = payload.message.strip() or "N/A"

        sales_message = render_marketing_email(
            self._settings,
            eyebrow="Sales Lead",
            title="New pricing request",
            intro="A visitor requested pricing information from the marketing site.",
            sections=[
                EmailSection(label="Name", value=full_name),
                EmailSection(label="Email", value=email),
                EmailSection(label="Institution", value=institution),
                EmailSection(label="Organization size", value=payload.org_size_bucket),
                EmailSection(label="Source", value=source),
                EmailSection(label="Message", value=message),
            ],
            closing="Review the inquiry and follow up from the sales inbox.",
        )

        await asyncio.to_thread(
            self._send,
            subject=f"New pricing request - {full_name}",
            to=[self._settings.sales_email],
            html_body=sales_message.html,
            text_body=sales_message.text,
        )
        customer_message = render_marketing_email(
            self._settings,
            eyebrow="Pricing request received",
            title=f"Thanks, {payload.first_name.strip()}",
            intro=(
                "We've got your pricing request. While our team reviews it, here is the "
                "DeepPatient walkthrough video you can review or share internally."
            ),
            cta_label="Watch the DeepPatient walkthrough",
            cta_url=self._settings.product_video_url,
            closing="The DeepPatient team will follow up with next steps soon.",
        )
        await asyncio.to_thread(
            self._send,
            subject="We received your DeepPatient pricing request",
            to=[email],
            html_body=customer_message.html,
            text_body=customer_message.text,
            reply_to=[self._settings.sales_email],
        )


def _email_domain(value: str) -> str | None:
    _, address = parseaddr(value)
    if "@" not in address:
        return None
    return address.rsplit("@", 1)[1].lower()


def _email_domains(values: list[str]) -> list[str]:
    domains = {
        domain
        for value in values
        if (domain := _email_domain(value)) is not None
    }
    return sorted(domains)
