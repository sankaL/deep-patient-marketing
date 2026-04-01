from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

from dependencies import get_lead_service, get_notification_service

from conftest import app, create_client


class FakeLeadService:
    async def capture_demo_request(self, payload):
        return SimpleNamespace(request_id=uuid4())

    async def capture_pricing_request(self, payload):
        return SimpleNamespace(request_id=uuid4())


class FakeNotificationService:
    def __init__(self) -> None:
        self.demo_notifications: list[object] = []
        self.pricing_notifications: list[object] = []

    async def send_newsletter_welcome(self, email: str) -> bool:
        return True

    async def send_demo_request_notifications(self, payload) -> None:
        self.demo_notifications.append(payload)
        return None

    async def send_pricing_inquiry_notification(self, payload) -> None:
        self.pricing_notifications.append(payload)
        return None


def test_demo_request_returns_persisted_request_id():
    fake_notifications = FakeNotificationService()
    app.dependency_overrides[get_lead_service] = lambda: FakeLeadService()
    app.dependency_overrides[get_notification_service] = (
        lambda: fake_notifications
    )

    try:
        client = create_client()
        response = client.post(
            "/api/demo-request",
            json={
                "name": "Jane Smith",
                "email": "jane@example.com",
                "institution": "DeepPatient University",
                "team_size_text": "10-50 learners",
                "request_source": "book_demo",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["request_id"]
    assert len(fake_notifications.demo_notifications) == 1


def test_live_preview_demo_request_skips_notifications():
    fake_notifications = FakeNotificationService()
    app.dependency_overrides[get_lead_service] = lambda: FakeLeadService()
    app.dependency_overrides[get_notification_service] = (
        lambda: fake_notifications
    )

    try:
        client = create_client()
        response = client.post(
            "/api/demo-request",
            json={
                "name": "Jane Smith",
                "email": "jane@example.com",
                "institution": "DeepPatient University",
                "team_size_text": "10-50 learners",
                "request_source": "live_preview",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert fake_notifications.demo_notifications == []


def test_pricing_inquiry_returns_persisted_request_id():
    fake_notifications = FakeNotificationService()
    app.dependency_overrides[get_lead_service] = lambda: FakeLeadService()
    app.dependency_overrides[get_notification_service] = (
        lambda: fake_notifications
    )

    try:
        client = create_client()
        response = client.post(
            "/api/pricing-inquiry",
            json={
                "firstName": "Jane",
                "lastName": "Smith",
                "email": "jane@example.com",
                "institution": "DeepPatient University",
                "orgSize": "51–150",
                "source": "Conference",
                "message": "We are evaluating pilots.",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["request_id"]
    assert len(fake_notifications.pricing_notifications) == 1
