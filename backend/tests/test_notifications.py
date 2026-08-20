from __future__ import annotations

import asyncio
from types import SimpleNamespace

import services.notifications as notifications_module
from config import NotificationSettings
from models.public import DemoRequest, PricingInquiryRequest
from services.notifications import NotificationService


def _settings() -> NotificationSettings:
    return NotificationSettings(
        resend_api_key="re_test_key",
        from_email="sales@deeppatient.io",
        sales_email="sales@deeppatient.io",
        product_video_url="https://video.example.com/deeppatient-demo",
    )


def _install_fake_resend(monkeypatch):
    calls: list[dict[str, object]] = []
    fake_resend = SimpleNamespace(
        api_key=None,
        Emails=SimpleNamespace(send=lambda payload: calls.append(payload)),
    )
    monkeypatch.setattr(notifications_module, "resend", fake_resend)
    return calls, fake_resend


def test_demo_request_notifications_use_sales_and_reply_to(monkeypatch):
    calls, fake_resend = _install_fake_resend(monkeypatch)
    service = NotificationService(_settings())

    asyncio.run(
        service.send_demo_request_notifications(
            DemoRequest(
                name="Jane Smith",
                email="jane@example.com",
                institution="DeepPatient University",
                team_size_text="10-50 learners",
            )
        )
    )

    assert fake_resend.api_key == "re_test_key"
    assert len(calls) == 2
    internal_email, customer_email = calls
    assert internal_email["from"] == "DeepPatient <sales@deeppatient.io>"
    assert internal_email["to"] == ["sales@deeppatient.io"]
    assert "reply_to" not in internal_email
    assert customer_email["from"] == "DeepPatient <sales@deeppatient.io>"
    assert customer_email["to"] == ["jane@example.com"]
    assert customer_email["reply_to"] == ["sales@deeppatient.io"]
    assert (
        '<span style="color: #F9D38B;">Deep</span><span style="color: #FFFFFF;">Patient</span>'
        in str(customer_email["html"])
    )
    assert "https://video.example.com/deeppatient-demo" in str(customer_email["html"])
    assert "https://video.example.com/deeppatient-demo" in str(customer_email["text"])
    assert "attachments" not in customer_email


def test_pricing_request_notifications_send_internal_and_confirmation(monkeypatch):
    calls, _ = _install_fake_resend(monkeypatch)
    service = NotificationService(_settings())

    asyncio.run(
        service.send_pricing_inquiry_notification(
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

    assert len(calls) == 2
    assert calls[0]["to"] == ["sales@deeppatient.io"]
    assert calls[1]["to"] == ["jane@example.com"]
    assert calls[1]["reply_to"] == ["sales@deeppatient.io"]
