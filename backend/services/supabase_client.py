from __future__ import annotations

from typing import Any

import httpx

from config import SupabaseSettings


class SupabaseRestError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


class SupabaseRestClient:
    def __init__(self, settings: SupabaseSettings) -> None:
        self._base_url = f"{settings.url}/rest/v1"
        self._service_role_key = settings.service_role_key
        self._timeout = settings.request_timeout_seconds

    async def insert_one(
        self, relation: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self._service_role_key}",
            "apikey": self._service_role_key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    f"{self._base_url}/{relation}",
                    params={"select": "*"},
                    headers=headers,
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise SupabaseRestError("Supabase could not be reached.") from exc

        if response.is_error:
            status_code = response.status_code if response.status_code >= 400 else 503
            raise SupabaseRestError("Supabase rejected the request.", status_code)

        try:
            rows = response.json()
        except ValueError as exc:
            raise SupabaseRestError("Supabase returned an invalid response.") from exc
        if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
            raise SupabaseRestError("Supabase returned an invalid response.")

        return rows[0]
