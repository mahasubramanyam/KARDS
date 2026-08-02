from dataclasses import dataclass
from uuid import UUID

from app.models.audit import AuditLog
from app.models.enums import AuditSeverity
from app.services.container import Services


@dataclass
class RequestContext:
    ip_address: str | None = None
    user_agent: str | None = None


class AuditService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def log(
        self,
        actor_id: UUID | None,
        actor_email: str | None,
        action: str,
        subject_type: str | None = None,
        subject_id: UUID | None = None,
        details: dict | None = None,
        severity: AuditSeverity = AuditSeverity.INFO,
        context: RequestContext | None = None,
    ) -> None:
        entry = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            subject_type=subject_type,
            subject_id=subject_id,
            details=details,
            ip_address=context.ip_address if context else None,
            user_agent=context.user_agent if context else None,
            severity=severity,
        )
        self.s.audits.add(entry)
