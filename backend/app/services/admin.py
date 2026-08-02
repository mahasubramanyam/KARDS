from uuid import UUID

from sqlalchemy import func, select

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.services.audit import AuditService
from app.services.container import Services


class AdminService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def list_users(
        self,
        role: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[User]:
        q = select(User)
        if role:
            q = q.where(User.role == role)
        if search:
            term = f"%{search.lower()}%"
            q = q.where(User.email.ilike(term) | User.full_name.ilike(term))
        return list(self.s.db.scalars(q.order_by(User.created_at.desc()).offset(skip).limit(limit)).all())

    def count_users(self, role: str | None = None) -> int:
        q = select(func.count()).select_from(User)
        if role:
            q = q.where(User.role == role)
        return int(self.s.db.scalar(q) or 0)

    def set_user_active(self, admin: User, user_id: UUID, is_active: bool) -> User:
        user = self.s.users.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        user.is_active = is_active
        AuditService(self.s).log(
            admin.id,
            admin.email,
            f"user.{'deactivated' if not is_active else 'activated'}",
            subject_type="user",
            subject_id=user.id,
        )
        return user

    def audit_logs(self, severity: str | None = None, skip: int = 0, limit: int = 50):
        return self.s.audits.list_filtered(severity, skip, limit)
