from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from config import AdminAuthSettings


class AdminAuthError(RuntimeError):
    def __init__(self, message: str, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class AdminSession:
    access_token: str
    refresh_token: str
    expires_at: datetime
    email: str


class AdminAuthService:
    def __init__(self, settings: AdminAuthSettings) -> None:
        self._settings = settings

    @property
    def settings(self) -> AdminAuthSettings:
        return self._settings

    async def login(self, *, email: str, password: str) -> AdminSession:
        payload = await self._request(
            "POST",
            "token",
            params={"grant_type": "password"},
            json={"email": email, "password": password},
        )
        return self._parse_session(payload)

    async def refresh(self, *, refresh_token: str) -> AdminSession:
        payload = await self._request(
            "POST",
            "token",
            params={"grant_type": "refresh_token"},
            json={"refresh_token": refresh_token},
        )
        return self._parse_session(payload)

    async def get_user_email(self, *, access_token: str) -> str:
        payload = await self._request(
            "GET",
            "user",
            access_token=access_token,
        )
        email = str(payload.get("email", "")).strip().lower()
        if not email:
            raise AdminAuthError("Your admin session is invalid. Please sign in again.")
        return email

    def is_allowed_admin_email(self, email: str) -> bool:
        normalized = email.strip().lower()
        return normalized in self._settings.allowed_admin_emails

    def needs_refresh(self, expires_at: datetime) -> bool:
        return expires_at <= datetime.now(timezone.utc) + timedelta(
            seconds=self._settings.refresh_slack_seconds
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        json: dict[str, Any] | None = None,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        headers = {
            "apikey": self._settings.anon_key,
            "Content-Type": "application/json",
        }
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.request(
                    method=method,
                    url=f"{self._settings.auth_url.rstrip('/')}/{path.lstrip('/')}",
                    headers=headers,
                    params=params,
                    json=json,
                )
        except httpx.TimeoutException as exc:
            raise AdminAuthError(
                "Admin sign-in is unavailable right now. Please try again.",
                status_code=503,
            ) from exc
        except httpx.HTTPError as exc:
            raise AdminAuthError(
                "Admin sign-in is unavailable right now. Please try again.",
                status_code=503,
            ) from exc

        if response.status_code in {400, 401, 403}:
            raise AdminAuthError("Incorrect email or password.", status_code=401)
        if response.status_code >= 400:
            raise AdminAuthError(
                "Admin sign-in is unavailable right now. Please try again.",
                status_code=503,
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise AdminAuthError(
                "Admin sign-in returned an invalid response.",
                status_code=503,
            ) from exc

        if not isinstance(payload, dict):
            raise AdminAuthError(
                "Admin sign-in returned an invalid response.",
                status_code=503,
            )

        return payload

    def _parse_session(self, payload: dict[str, Any]) -> AdminSession:
        access_token = str(payload.get("access_token", "")).strip()
        refresh_token = str(payload.get("refresh_token", "")).strip()
        expires_in = int(payload.get("expires_in", 0) or 0)
        user = payload.get("user")
        email = str(user.get("email", "")).strip().lower() if isinstance(user, dict) else ""

        if not access_token or not refresh_token or not email or expires_in <= 0:
            raise AdminAuthError(
                "Admin sign-in returned an invalid response.",
                status_code=503,
            )

        return AdminSession(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=expires_in),
            email=email,
        )
