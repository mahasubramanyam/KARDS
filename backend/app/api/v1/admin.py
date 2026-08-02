from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import ADMIN_USER, SERVICES
from app.schemas.api import AuditOut
from app.schemas.auth import UserOut
from app.schemas.common import Page
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=Page[UserOut])
def list_users(
    admin: ADMIN_USER,
    services: SERVICES,
    role: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> Page[UserOut]:
    items = AdminService(services).list_users(role, search, skip, limit)
    total = AdminService(services).count_users(role)
    return Page(
        items=[UserOut.model_validate(u) for u in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(user_id: UUID, admin: ADMIN_USER, services: SERVICES) -> UserOut:
    return UserOut.model_validate(AdminService(services).set_user_active(admin, user_id, False))


@router.post("/users/{user_id}/activate", response_model=UserOut)
def activate_user(user_id: UUID, admin: ADMIN_USER, services: SERVICES) -> UserOut:
    return UserOut.model_validate(AdminService(services).set_user_active(admin, user_id, True))


@router.get("/audit-logs", response_model=Page[AuditOut])
def audit_logs(
    admin: ADMIN_USER,
    services: SERVICES,
    severity: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> Page[AuditOut]:
    items = AdminService(services).audit_logs(severity, skip, limit)
    from app.models.audit import AuditLog

    clauses = [] if not severity else [AuditLog.severity == severity]
    total = services.audits.count(*clauses)
    return Page(
        items=[AuditOut.model_validate(a) for a in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )
