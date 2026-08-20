from __future__ import annotations

from typing import Any

import asyncpg
import httpx

from config import SupabaseSettings


class SupabaseRestError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


class SupabaseRestClient:
    def __init__(self, settings: SupabaseSettings) -> None:
        self._database_url = settings.database_url
        self._base_url = f"{settings.url}/rest/v1" if settings.url else ""
        self._service_role_key = settings.service_role_key
        self._timeout = settings.request_timeout_seconds
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            if not self._database_url:
                raise SupabaseRestError("Database connection URL is not configured.")
            try:
                self._pool = await asyncpg.create_pool(
                    dsn=self._database_url,
                    min_size=1,
                    max_size=10,
                    command_timeout=self._timeout,
                )
            except Exception as exc:
                raise SupabaseRestError(
                    f"Failed to connect to the database: {exc}",
                    status_code=500,
                ) from exc
        return self._pool

    async def insert_one(
        self, relation: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        if self._database_url:
            pool = await self._get_pool()
            cols = list(payload.keys())
            vals = list(payload.values())
            cols_str = ", ".join(f'"{c}"' for c in cols)
            placeholders = ", ".join(f"${i+1}" for i in range(len(cols)))
            query = f'INSERT INTO public."{relation}" ({cols_str}) VALUES ({placeholders}) RETURNING *'
            try:
                async with pool.acquire() as conn:
                    rows = await conn.fetch(query, *vals)
                    if not rows:
                        raise SupabaseRestError("Insert failed to return row.")
                    return dict(rows[0])
            except Exception as exc:
                raise SupabaseRestError(f"Database query failed: {exc}", status_code=500) from exc

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
