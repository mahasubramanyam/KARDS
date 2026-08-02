from datetime import datetime
from uuid import UUID

from app.core import security
from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.models.enums import Role
from app.models.partner import ApiKey
from app.models.user import User
from app.schemas.api import ApiKeyCreate, ApiKeyCreated
from app.services.audit import AuditService
from app.services.container import Services


class PartnerService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def create_key(self, company: User, payload: ApiKeyCreate) -> ApiKeyCreated:
        require(Role.COMPANY, Permission.MANAGE_API_KEYS)
        prefix = security.api_key_prefix()
        secret = security.api_key_secret()
        plain = f"{prefix}.{secret}"

        key = self.s.api_keys.add(
            ApiKey(
                company_user_id=company.id,
                name=payload.name.strip(),
                key_prefix=prefix,
                key_hash=security.sha256_hex(plain),
                scopes=payload.scopes,
                rate_limit_per_hour=payload.rate_limit_per_hour,
            )
        )
        AuditService(self.s).log(
            company.id, company.email, "api_key.created", subject_type="api_key", subject_id=key.id
        )
        return ApiKeyCreated(
            id=key.id,
            company_user_id=key.company_user_id,
            name=key.name,
            key_prefix=key.key_prefix,
            scopes=key.scopes,
            is_active=key.is_active,
            rate_limit_per_hour=key.rate_limit_per_hour,
            last_used_at=key.last_used_at,
            revoked_at=key.revoked_at,
            created_at=key.created_at,
            plain_key=plain,
        )

    def list_keys(self, company: User) -> list[ApiKey]:
        return self.s.api_keys.list_for_company(company.id)

    def revoke_key(self, company: User, key_id: UUID) -> None:
        key = self.s.api_keys.get(key_id)
        if not key or key.company_user_id != company.id:
            raise NotFoundError("API key not found")
        if key.revoked_at:
            raise ValidationFailedError("API key already revoked", code="already_revoked")
        key.revoked_at = utcnow()
        key.is_active = False
        AuditService(self.s).log(
            company.id, company.email, "api_key.revoked", subject_type="api_key", subject_id=key.id
        )

    def authenticate(self, plain_key: str) -> ApiKey:
        key = self.s.api_keys.by_key_hash(security.sha256_hex(plain_key))
        if not key or not key.is_active or key.revoked_at:
            raise NotFoundError("Invalid or revoked API key")
        key.last_used_at = utcnow()
        return key

    def list_active_keys(self) -> list[ApiKey]:
        return [
            k for k in self.s.api_keys.list_all() if k.is_active and not k.revoked_at
        ]
