from __future__ import annotations

import html
import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from config import NotificationSettings
from models.public import DemoRequest, PricingInquiryRequest
from models.tavus import TavusUsageRollup

try:
    import resend
except ImportError:  # pragma: no cover - optional dependency in local dev
    resend = None  # type: ignore


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ReminderDispatchResult:
    sent: bool
    sent_at: datetime | None


class NotificationService:
    def __init__(self, settings: NotificationSettings) -> None:
        self._settings = settings
        if resend and settings.resend_api_key:
            resend.api_key = settings.resend_api_key

    def _send(self, *, subject: str, to: list[str], html_body: str) -> bool:
        if not resend or not self._settings.resend_api_key:
            logger.info(
                "Skipping email delivery because Resend is not configured.",
                extra={"subject": subject, "recipients": to},
            )
            return False

        resend.Emails.send(
            {
                "from": self._settings.from_email,
                "to": to,
                "subject": subject,
                "html": html_body,
            }
        )
        return True

    async def send_newsletter_welcome(self, email: str) -> bool:
        safe_email = html.escape(email)
        return self._send(
            subject="Welcome to DeepPatient!",
            to=[email],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #202F31;">Welcome to DeepPatient!</h2>
              <p style="color: #5C7066; line-height: 1.6;">
                Thanks for subscribing with {safe_email}. You'll receive updates on clinical
                education, AI in medicine, and DeepPatient product news.
              </p>
              <p style="color: #5C7066;">— The DeepPatient Team</p>
            </div>
            """,
        )

    async def send_demo_request_notifications(self, payload: DemoRequest) -> None:
        safe_name = html.escape(payload.name.strip())
        safe_email = html.escape(str(payload.email))
        safe_institution = html.escape(payload.institution.strip() or "N/A")
        safe_team_size = html.escape(payload.team_size_text.strip() or "N/A")
        safe_source = html.escape(payload.request_source)

        self._send(
            subject=f"New Demo Request — {safe_name}",
            to=[self._settings.admin_email],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #202F31;">New Demo Request</h2>
              <p><strong>Name:</strong> {safe_name}</p>
              <p><strong>Email:</strong> {safe_email}</p>
              <p><strong>Institution:</strong> {safe_institution}</p>
              <p><strong>Team Size:</strong> {safe_team_size}</p>
              <p><strong>Source:</strong> {safe_source}</p>
            </div>
            """,
        )
        self._send(
            subject="Your DeepPatient Demo Request",
            to=[str(payload.email)],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #202F31;">Thanks, {safe_name}!</h2>
              <p style="color: #5C7066; line-height: 1.6;">
                We have received your request and will follow up soon.
              </p>
              <p style="color: #5C7066;">— The DeepPatient Team</p>
            </div>
            """,
        )

    async def send_pricing_inquiry_notification(
        self, payload: PricingInquiryRequest
    ) -> None:
        safe_first_name = html.escape(payload.first_name.strip())
        safe_last_name = html.escape(payload.last_name.strip())
        safe_email = html.escape(str(payload.email))
        safe_institution = html.escape(payload.institution.strip())
        safe_org_size = html.escape(payload.org_size_bucket)
        safe_source = html.escape(payload.source.strip() or "N/A")
        safe_message = html.escape(payload.message.strip() or "N/A")

        self._send(
            subject=f"New Pricing Inquiry — {safe_first_name} {safe_last_name}",
            to=[self._settings.admin_email],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #202F31;">New Pricing Inquiry</h2>
              <p><strong>Name:</strong> {safe_first_name} {safe_last_name}</p>
              <p><strong>Email:</strong> {safe_email}</p>
              <p><strong>Institution:</strong> {safe_institution}</p>
              <p><strong>Organization Size:</strong> {safe_org_size}</p>
              <p><strong>Source:</strong> {safe_source}</p>
              <p><strong>Message:</strong> {safe_message}</p>
            </div>
            """,
        )

    async def send_low_quota_alert(
        self, *, key_label: str, rollup: TavusUsageRollup
    ) -> ReminderDispatchResult:
        sent = self._send(
            subject=f"Tavus key nearing exhaustion — {html.escape(key_label)}",
            to=[self._settings.admin_email],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
              <h2 style="color: #202F31;">Tavus preview capacity is low</h2>
              <p style="color: #5C7066; line-height: 1.6;">
                The active Tavus key <strong>{html.escape(key_label)}</strong> now has
                approximately <strong>{rollup.seconds_remaining_estimate}</strong> seconds
                remaining.
              </p>
              <p style="color: #5C7066; line-height: 1.6;">
                Threshold: {rollup.low_quota_threshold_seconds} seconds
              </p>
            </div>
            """,
        )
        return ReminderDispatchResult(
            sent=sent,
            sent_at=datetime.now(timezone.utc) if sent else None,
        )

    async def send_exhausted_capacity_alert(
        self,
        *,
        key_label: str,
        attempted_at: datetime,
        request_name: str | None,
        request_email: str | None,
        request_institution: str | None,
    ) -> ReminderDispatchResult:
        safe_name = html.escape((request_name or "Unknown").strip() or "Unknown")
        safe_email = html.escape((request_email or "Unknown").strip() or "Unknown")
        safe_institution = html.escape(
            (request_institution or "Unknown").strip() or "Unknown"
        )

        sent = self._send(
            subject=f"Tavus preview credits exhausted — {html.escape(key_label)}",
            to=[self._settings.sales_email],
            html_body=f"""
            <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
              <h2 style="color: #202F31;">A user attempted to start the live preview with no credits left</h2>
              <p style="color: #5C7066; line-height: 1.6;">
                Attempted at <strong>{html.escape(attempted_at.isoformat())}</strong>.
              </p>
              <p><strong>Active key label:</strong> {html.escape(key_label)}</p>
              <p><strong>Name:</strong> {safe_name}</p>
              <p><strong>Email:</strong> {safe_email}</p>
              <p><strong>Institution:</strong> {safe_institution}</p>
            </div>
            """,
        )
        return ReminderDispatchResult(
            sent=sent,
            sent_at=datetime.now(timezone.utc) if sent else None,
        )
