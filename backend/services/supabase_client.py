from __future__ import annotations

from dataclasses import dataclass
from typing import Any
import asyncpg

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
        self._database_url = settings.url
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            try:
                self._pool = await asyncpg.create_pool(
                    self._database_url,
                    min_size=2,
                    max_size=10,
                )
            except Exception as exc:
                raise SupabaseRestError(
                    f"Failed to connect to the database: {exc}",
                    status_code=500,
                ) from exc
        return self._pool

    async def execute_query(self, query: str, *args: Any) -> list[asyncpg.Record]:
        pool = await self._get_pool()
        try:
            async with pool.acquire() as conn:
                return await conn.fetch(query, *args)
        except Exception as exc:
            raise SupabaseRestError(
                f"Database query failed: {exc}",
                status_code=500,
            ) from exc

    def _parse_filters(
        self, filters: dict[str, str] | None, start_param_idx: int = 1
    ) -> tuple[list[str], list[Any]]:
        where_clauses = []
        params = []
        if filters:
            for col, val_str in filters.items():
                if val_str.startswith("eq."):
                    val = val_str[3:]
                    params.append(val)
                    where_clauses.append(f'"{col}" = ${len(params) + start_param_idx - 1}')
        return where_clauses, params

    async def select_one(
        self,
        relation: str,
        *,
        select: str = "*",
        filters: dict[str, str] | None = None,
    ) -> dict[str, Any] | None:
        where_clauses, params = self._parse_filters(filters)
        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        query = f'SELECT {select} FROM public."{relation}"{where_sql} LIMIT 1'
        rows = await self.execute_query(query, *params)
        return dict(rows[0]) if rows else None

    async def select_many(
        self,
        relation: str,
        *,
        select: str = "*",
        filters: dict[str, str] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        # 1. Custom join for tavus_preview_sessions & demo_requests
        if relation == "tavus_preview_sessions" and "demo_requests" in select:
            query = """
                SELECT 
                    ps.id, ps.started_at, ps.ended_at, ps.duration_seconds_estimate,
                    dr.name AS dr_name, dr.email AS dr_email, dr.institution AS dr_institution, dr.request_source AS dr_request_source
                FROM public.tavus_preview_sessions ps
                LEFT JOIN public.demo_requests dr ON dr.id = ps.demo_request_id
            """
            where_clauses, params = self._parse_filters(filters)
            if where_clauses:
                # Map ps prefix
                mapped_clauses = [f"ps.{c}" for c in where_clauses]
                query += " WHERE " + " AND ".join(mapped_clauses)
            if order:
                col, direction = order.split(".")
                query += f" ORDER BY ps.{col} {direction.upper()}"
            if limit is not None:
                query += f" LIMIT {limit}"

            rows = await self.execute_query(query, *params)
            results = []
            for r in rows:
                demo_req = None
                if r["dr_email"] or r["dr_name"]:
                    demo_req = [
                        {
                            "name": r["dr_name"],
                            "email": r["dr_email"],
                            "institution": r["dr_institution"],
                            "request_source": r["dr_request_source"],
                        }
                    ]
                results.append({
                    "id": r["id"],
                    "started_at": r["started_at"],
                    "ended_at": r["ended_at"],
                    "duration_seconds_estimate": r["duration_seconds_estimate"],
                    "demo_requests": demo_req,
                })
            return results

        # 2. Custom join for tavus_preview_denials & demo_requests
        if relation == "tavus_preview_denials" and "demo_requests" in select:
            query = """
                SELECT 
                    pd.id, pd.reason, pd.attempted_at, pd.sales_alert_sent, pd.demo_request_id,
                    dr.name AS dr_name, dr.email AS dr_email
                FROM public.tavus_preview_denials pd
                LEFT JOIN public.demo_requests dr ON dr.id = pd.demo_request_id
            """
            where_clauses, params = self._parse_filters(filters)
            if where_clauses:
                mapped_clauses = [f"pd.{c}" for c in where_clauses]
                query += " WHERE " + " AND ".join(mapped_clauses)
            if order:
                col, direction = order.split(".")
                query += f" ORDER BY pd.{col} {direction.upper()}"
            if limit is not None:
                query += f" LIMIT {limit}"

            rows = await self.execute_query(query, *params)
            results = []
            for r in rows:
                demo_req = None
                if r["dr_email"] or r["dr_name"]:
                    demo_req = [
                        {
                            "name": r["dr_name"],
                            "email": r["dr_email"],
                        }
                    ]
                results.append({
                    "id": r["id"],
                    "reason": r["reason"],
                    "attempted_at": r["attempted_at"],
                    "sales_alert_sent": r["sales_alert_sent"],
                    "demo_request_id": r["demo_request_id"],
                    "demo_requests": demo_req,
                })
            return results

        # 3. Standard, generic select_many query
        where_clauses, params = self._parse_filters(filters)
        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        order_sql = ""
        if order:
            col, direction = order.split(".")
            order_sql = f' ORDER BY "{col}" {direction.upper()}'

        limit_sql = ""
        if limit is not None:
            limit_sql = f" LIMIT {limit}"

        query = f'SELECT {select} FROM public."{relation}"{where_sql}{order_sql}{limit_sql}'
        rows = await self.execute_query(query, *params)
        return [dict(r) for r in rows]

    async def insert_one(self, relation: str, payload: dict[str, Any]) -> dict[str, Any]:
        cols = list(payload.keys())
        vals = list(payload.values())
        cols_str = ", ".join(f'"{c}"' for c in cols)
        placeholders = ", ".join(f"${i+1}" for i in range(len(cols)))

        query = f'INSERT INTO public."{relation}" ({cols_str}) VALUES ({placeholders}) RETURNING *'
        rows = await self.execute_query(query, *vals)
        return dict(rows[0])

    async def update_one(
        self,
        relation: str,
        *,
        filters: dict[str, str],
        payload: dict[str, Any],
    ) -> dict[str, Any] | None:
        set_clauses = []
        params = []

        for col, val in payload.items():
            params.append(val)
            set_clauses.append(f'"{col}" = ${len(params)}')

        where_clauses, filter_params = self._parse_filters(filters, start_param_idx=len(params) + 1)
        params.extend(filter_params)

        set_sql = ", ".join(set_clauses)
        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        query = f'UPDATE public."{relation}" SET {set_sql}{where_sql} RETURNING *'
        rows = await self.execute_query(query, *params)
        return dict(rows[0]) if rows else None

    async def rpc(
        self, function_name: str, payload: dict[str, Any] | None = None
    ) -> SupabaseRpcResult:
        if not payload:
            query = f"SELECT * FROM public.{function_name}()"
            params = []
        else:
            args = []
            params = []
            for k, v in payload.items():
                params.append(v)
                args.append(f"{k} := ${len(params)}")
            args_str = ", ".join(args)
            query = f"SELECT * FROM public.{function_name}({args_str})"

        rows = await self.execute_query(query, *params)
        return SupabaseRpcResult(rows=[dict(r) for r in rows])
