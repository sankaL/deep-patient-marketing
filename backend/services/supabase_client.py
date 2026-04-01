from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from config import SupabaseSettings


class SupabaseRestError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class SupabaseRpcResult:
    rows: list[dict[str, Any]]

    def first(self) -> dict[str, Any] | None:
        return self.rows[0] if self.rows else None


class SupabaseRestClient:
    def __init__(self, settings: SupabaseSettings) -> None:
        base_url = settings.url.rstrip("/")
        if not base_url.endswith("/rest/v1"):
            base_url = f"{base_url}/rest/v1"

        self._base_url = base_url
        self._request_timeout_seconds = settings.request_timeout_seconds
        self._service_role_key = settings.service_role_key

    def _headers(self, *, prefer: str | None = None) -> dict[str, str]:
        headers = {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        json: dict[str, Any] | None = None,
        prefer: str | None = None,
    ) -> Any:
        try:
            async with httpx.AsyncClient(timeout=self._request_timeout_seconds) as client:
                response = await client.request(
                    method=method,
                    url=f"{self._base_url}/{path.lstrip('/')}",
                    headers=self._headers(prefer=prefer),
                    params=params,
                    json=json,
                )
        except httpx.TimeoutException as exc:
            raise SupabaseRestError("The data service timed out. Please try again.") from exc
        except httpx.HTTPError as exc:
            raise SupabaseRestError(
                "The data service is unavailable right now. Please try again later."
            ) from exc

        if response.status_code >= 400:
            message = "The data service is unavailable right now. Please try again later."
            try:
                error_payload = response.json()
            except ValueError:
                error_payload = None
            if isinstance(error_payload, dict):
                error_message = (
                    error_payload.get("message")
                    or error_payload.get("error_description")
                    or error_payload.get("details")
                    or error_payload.get("hint")
                )
                if isinstance(error_message, str) and error_message.strip():
                    message = error_message.strip()
            raise SupabaseRestError(
                message,
                status_code=503,
            )

        if not response.content:
            return None

        try:
            return response.json()
        except ValueError as exc:
            raise SupabaseRestError(
                "The data service returned an invalid response. Please try again later."
            ) from exc

    async def select_one(
        self,
        relation: str,
        *,
        select: str = "*",
        filters: dict[str, str] | None = None,
    ) -> dict[str, Any] | None:
        params = {"select": select, "limit": "1"}
        if filters:
            params.update(filters)

        payload = await self._request("GET", relation, params=params)
        if not isinstance(payload, list):
            raise SupabaseRestError(
                "The data service returned an invalid response. Please try again later."
            )
        return payload[0] if payload else None

    async def select_many(
        self,
        relation: str,
        *,
        select: str = "*",
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        params = {"select": select}
        if filters:
            params.update(filters)
        if order:
            params["order"] = order
        if limit is not None:
            params["limit"] = str(limit)

        payload = await self._request("GET", relation, params=params)
        if not isinstance(payload, list):
            raise SupabaseRestError(
                "The data service returned an invalid response. Please try again later."
            )
        return payload

    async def insert_one(self, relation: str, payload: dict[str, Any]) -> dict[str, Any]:
        response_payload = await self._request(
            "POST",
            relation,
            json=payload,
            prefer="return=representation",
        )
        if not isinstance(response_payload, list) or len(response_payload) != 1:
            raise SupabaseRestError(
                "The data service returned an invalid response. Please try again later."
            )
        return response_payload[0]

    async def update_one(
        self,
        relation: str,
        *,
        filters: dict[str, str],
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        response_payload = await self._request(
            "PATCH",
            relation,
            params=filters,
            json=payload,
            prefer="return=representation",
        )
        if not isinstance(response_payload, list):
            raise SupabaseRestError(
                "The data service returned an invalid response. Please try again later."
            )
        return response_payload[0] if response_payload else None

    async def rpc(
        self, function_name: str, payload: dict[str, Any] | None = None
    ) -> SupabaseRpcResult:
        response_payload = await self._request(
            "POST",
            f"rpc/{function_name}",
            json=payload or {},
        )
        if response_payload is None:
            return SupabaseRpcResult(rows=[])
        if isinstance(response_payload, list):
            return SupabaseRpcResult(rows=response_payload)
        if isinstance(response_payload, dict):
            return SupabaseRpcResult(rows=[response_payload])
        raise SupabaseRestError(
            "The data service returned an invalid response. Please try again later."
        )
