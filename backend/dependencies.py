from __future__ import annotations

from functools import lru_cache

from config import (
    AdminAuthSettings,
    NotificationSettings,
    SupabaseSettings,
    TavusRuntimeSettings,
    get_admin_auth_settings,
    get_notification_settings,
    get_supabase_settings,
    get_tavus_runtime_settings,
)
from services.admin_auth import AdminAuthService
from services.leads import LeadService
from services.notifications import NotificationService
from services.supabase_client import SupabaseRestClient
from services.tavus_admin import TavusAdminService
from services.tavus_state import TavusPreviewStateService


@lru_cache(maxsize=1)
def _get_supabase_settings() -> SupabaseSettings:
    return get_supabase_settings()


@lru_cache(maxsize=1)
def _get_notification_settings() -> NotificationSettings:
    return get_notification_settings()


@lru_cache(maxsize=1)
def _get_admin_auth_settings() -> AdminAuthSettings:
    return get_admin_auth_settings()


@lru_cache(maxsize=1)
def _get_tavus_runtime_settings() -> TavusRuntimeSettings:
    return get_tavus_runtime_settings()


@lru_cache(maxsize=1)
def get_supabase_client() -> SupabaseRestClient:
    return SupabaseRestClient(_get_supabase_settings())


@lru_cache(maxsize=1)
def get_lead_service() -> LeadService:
    return LeadService(get_supabase_client())


@lru_cache(maxsize=1)
def get_notification_service() -> NotificationService:
    return NotificationService(_get_notification_settings())


@lru_cache(maxsize=1)
def get_admin_auth_service() -> AdminAuthService:
    return AdminAuthService(_get_admin_auth_settings())


@lru_cache(maxsize=1)
def get_tavus_preview_state_service() -> TavusPreviewStateService:
    return TavusPreviewStateService(get_supabase_client())


@lru_cache(maxsize=1)
def get_tavus_admin_service() -> TavusAdminService:
    return TavusAdminService(get_supabase_client())


def get_tavus_runtime_config() -> TavusRuntimeSettings:
    return _get_tavus_runtime_settings()
