from __future__ import annotations

from functools import lru_cache

from config import (
    NotificationSettings,
    SupabaseSettings,
    get_notification_settings,
    get_supabase_settings,
)
from services.leads import LeadService
from services.notifications import NotificationService
from services.supabase_client import SupabaseRestClient


@lru_cache(maxsize=1)
def _get_supabase_settings() -> SupabaseSettings:
    return get_supabase_settings()


@lru_cache(maxsize=1)
def _get_notification_settings() -> NotificationSettings:
    return get_notification_settings()


@lru_cache(maxsize=1)
def get_supabase_client() -> SupabaseRestClient:
    return SupabaseRestClient(_get_supabase_settings())


@lru_cache(maxsize=1)
def get_lead_service() -> LeadService:
    return LeadService(get_supabase_client())


@lru_cache(maxsize=1)
def get_notification_service() -> NotificationService:
    return NotificationService(_get_notification_settings())
