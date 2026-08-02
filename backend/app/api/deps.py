from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core import security
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.rbac import Role, require
from app.db.session import get_db
from app.models.partner import ApiKey
from app.models.user import User
from app.services.audit import RequestContext
from app.services.container import Services

from app.db.session import SessionLocal, get_db

DB = Annotated[Session, Depends(get_db)]


def get_services() -> Generator[Services, None, None]:
    db = SessionLocal()
    try:
        yield Services(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


SERVICES = Annotated[Services, Depends(get_services)]


def get_request_context(request: Request) -> RequestContext:
    ip = request.headers.get("x-forwarded-for")
    if ip:
        ip = ip.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else None
    return RequestContext(
        ip_address=ip,
        user_agent=request.headers.get("user-agent"),
    )


def extract_bearer(request: Request) -> str | None:
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    return auth.removeprefix("Bearer ").strip()


def get_current_user(request: Request, services: SERVICES) -> User:
    token = extract_bearer(request)
    if not token:
        raise UnauthorizedError()
    try:
        claims = security.decode_access_token(token)
    except Exception:
        raise UnauthorizedError("Invalid or expired access token", code="invalid_access_token")
    if claims.get("typ") != "access":
        raise UnauthorizedError("Invalid token type", code="invalid_access_token")
    user = services.users.by_id_active(claims["sub"])
    if not user:
        raise UnauthorizedError("User not found or inactive", code="invalid_user")
    return user


CURRENT_USER = Annotated[User, Depends(get_current_user)]


def admin_only(user: CURRENT_USER) -> User:
    if user.role != Role.ADMIN:
        raise ForbiddenError()
    return user


ADMIN_USER = Annotated[User, Depends(admin_only)]


def get_partner_key(request: Request, services: SERVICES) -> ApiKey:
    from app.models.partner import ApiKey

    from app.services.partner import PartnerService

    key = request.headers.get("X-API-Key")
    if not key:
        raise UnauthorizedError("Missing X-API-Key header", code="api_key_required")
    return PartnerService(services).authenticate(key)


PARTNER_KEY = Annotated[ApiKey, Depends(get_partner_key)]


def permission_guard(role: Role, permission: str) -> None:
    from app.core.rbac import Permission

    require(role, Permission(permission))
