from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from config import AdminAuthSettings
from dependencies import (
    get_admin_auth_service,
    get_tavus_admin_service,
    get_tavus_runtime_config,
)
from models.admin import (
    AdminLoginRequest,
    AdminSessionResponse,
    TavusDashboardResponse,
    TavusRotateKeyRequest,
    TavusRotateKeyResponse,
)
from models.public import BasicSuccessResponse
from services.admin_auth import AdminAuthError, AdminAuthService, AdminSession
from services.scenario_config import ScenarioConfigError, load_scenario_persona_config
from services.supabase_client import SupabaseRestError
from services.tavus import TavusServiceError, create_persona
from services.tavus_admin import TavusAdminService


router = APIRouter(prefix="/api/admin", tags=["admin"])


def _set_admin_session_cookies(
    response: Response,
    *,
    settings: AdminAuthSettings,
    session: AdminSession,
) -> None:
    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_same_site,
        "domain": settings.cookie_domain,
        "path": "/",
    }
    response.set_cookie(
        settings.access_cookie_name,
        session.access_token,
        max_age=max(
            int((session.expires_at - datetime.now(timezone.utc)).total_seconds()), 0
        ),
        **common,
    )
    response.set_cookie(
        settings.refresh_cookie_name,
        session.refresh_token,
        max_age=60 * 60 * 24 * 30,
        **common,
    )


def _clear_admin_session_cookies(
    response: Response, *, settings: AdminAuthSettings
) -> None:
    response.delete_cookie(
        settings.access_cookie_name,
        domain=settings.cookie_domain,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_same_site,
    )
    response.delete_cookie(
        settings.refresh_cookie_name,
        domain=settings.cookie_domain,
        path="/",
        secure=settings.cookie_secure,
        httponly=True,
        samesite=settings.cookie_same_site,
    )


async def _require_admin_email(
    request: Request,
    response: Response,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> str:
    access_token = request.cookies.get(auth_service.settings.access_cookie_name)
    refresh_token = request.cookies.get(auth_service.settings.refresh_cookie_name)

    async def _refresh_session(token: str) -> str:
        refreshed = await auth_service.refresh(refresh_token=token)
        if not auth_service.is_allowed_admin_email(refreshed.email):
            _clear_admin_session_cookies(response, settings=auth_service.settings)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is not authorized for this admin area.",
            )
        _set_admin_session_cookies(
            response, settings=auth_service.settings, session=refreshed
        )
        return refreshed.email

    if not access_token:
        if refresh_token:
            try:
                return await _refresh_session(refresh_token)
            except AdminAuthError as exc:
                _clear_admin_session_cookies(response, settings=auth_service.settings)
                raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    try:
        email = await auth_service.get_user_email(access_token=access_token)
    except AdminAuthError:
        if refresh_token:
            try:
                return await _refresh_session(refresh_token)
            except AdminAuthError as exc:
                _clear_admin_session_cookies(response, settings=auth_service.settings)
                raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
        _clear_admin_session_cookies(response, settings=auth_service.settings)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Please sign in to continue.",
        )

    if not auth_service.is_allowed_admin_email(email):
        _clear_admin_session_cookies(response, settings=auth_service.settings)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not authorized for this admin area.",
        )

    return email


@router.post("/auth/login", response_model=AdminSessionResponse)
async def admin_login(
    payload: AdminLoginRequest,
    response: Response,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> AdminSessionResponse:
    try:
        session = await auth_service.login(
            email=str(payload.email).strip(),
            password=payload.password,
        )
    except AdminAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc

    if not auth_service.is_allowed_admin_email(session.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not authorized for this admin area.",
        )

    _set_admin_session_cookies(response, settings=auth_service.settings, session=session)
    return AdminSessionResponse(email=session.email)


@router.post("/auth/logout", response_model=BasicSuccessResponse)
async def admin_logout(
    response: Response,
    auth_service: AdminAuthService = Depends(get_admin_auth_service),
) -> BasicSuccessResponse:
    _clear_admin_session_cookies(response, settings=auth_service.settings)
    return BasicSuccessResponse(success=True, message="Signed out.")


@router.get("/auth/session", response_model=AdminSessionResponse)
async def admin_session(
    admin_email: str = Depends(_require_admin_email),
) -> AdminSessionResponse:
    return AdminSessionResponse(email=admin_email)


@router.get("/tavus/dashboard", response_model=TavusDashboardResponse)
async def tavus_dashboard(
    _: str = Depends(_require_admin_email),
    tavus_admin: TavusAdminService = Depends(get_tavus_admin_service),
) -> TavusDashboardResponse:
    runtime = get_tavus_runtime_config()
    try:
        return await tavus_admin.get_dashboard(
            preview_max_duration_seconds=runtime.preview_max_duration_seconds,
            api_key_encryption_key=runtime.api_key_encryption_key,
        )
    except SupabaseRestError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail="The Tavus admin dashboard is unavailable right now.",
        ) from exc


@router.post("/tavus/rotate", response_model=TavusRotateKeyResponse)
async def rotate_tavus_key(
    payload: TavusRotateKeyRequest,
    admin_email: str = Depends(_require_admin_email),
    tavus_admin: TavusAdminService = Depends(get_tavus_admin_service),
) -> TavusRotateKeyResponse:
    try:
        persona_config = load_scenario_persona_config()
    except ScenarioConfigError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    runtime = get_tavus_runtime_config()

    try:
        rotation = await tavus_admin.begin_rotation(
            actor_email=admin_email,
            requested_label=payload.label.strip() or None,
            requested_replica_id=persona_config.default_replica_id,
        )
    except SupabaseRestError as exc:
        detail = str(exc)
        if "OPEN_PREVIEW_SESSIONS" in detail:
            detail = "Rotation is blocked while a live preview session is still active."
        elif "ACTIVE_SCENARIO_NOT_FOUND" in detail:
            detail = "The active Tavus preview is not configured."
        else:
            detail = "The Tavus key rotation could not be started right now."
        raise HTTPException(status_code=exc.status_code, detail=detail) from exc

    try:
        persona = await create_persona(
            api_key=payload.api_key.strip(),
            settings=runtime,
            persona_config=persona_config,
        )
        return await tavus_admin.complete_rotation(
            rotation_id=rotation.rotation_id,
            api_key_secret=payload.api_key.strip(),
            api_key_encryption_key=runtime.api_key_encryption_key,
            label=payload.label.strip() or "Rotated Tavus key",
            persona_id=persona.persona_id,
            replica_id=persona_config.default_replica_id,
            minutes_total_seconds=25 * 60,
            low_quota_threshold_seconds=5 * 60,
        )
    except (SupabaseRestError, TavusServiceError) as exc:
        try:
            await tavus_admin.fail_rotation(
                rotation_id=rotation.rotation_id,
                error_message=str(exc),
            )
        except SupabaseRestError:
            pass

        status_code = (
            exc.status_code if isinstance(exc, (SupabaseRestError, TavusServiceError)) else 503
        )
        raise HTTPException(
            status_code=status_code,
            detail="The Tavus key rotation failed. The previous active configuration was restored.",
        ) from exc
