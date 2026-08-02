from datetime import datetime
from uuid import UUID

from sqlalchemy import or_, select

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.db.base import utcnow
from app.models.certificate import Certificate
from app.models.dispute import Dispute
from app.models.enums import DisputeStatus, DisputeSubjectType
from app.models.user import User
from app.models.volunteering import WorkLog
from app.services.audit import AuditService
from app.services.container import Services


class DisputeService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def _resolve_against(self, subject_type: DisputeSubjectType, subject_id: UUID) -> UUID | None:
        if subject_type == DisputeSubjectType.WORK_LOG:
            worklog = self.s.db.get(WorkLog, subject_id)
            return worklog.ngo_user_id if worklog else None
        if subject_type == DisputeSubjectType.CERTIFICATE:
            certificate = self.s.db.get(Certificate, subject_id)
            return certificate.ngo_user_id if certificate else None
        if subject_type == DisputeSubjectType.OPPORTUNITY:
            from app.models.csr import Opportunity

            opportunity = self.s.db.get(Opportunity, subject_id)
            return opportunity.ngo_user_id if opportunity else None
        return None

    def file_dispute(self, user: User, subject_type: DisputeSubjectType, subject_id: UUID, summary: str) -> Dispute:
        subject_exists = False
        if subject_type == DisputeSubjectType.WORK_LOG:
            subject_exists = self.s.db.get(WorkLog, subject_id) is not None
        elif subject_type == DisputeSubjectType.CERTIFICATE:
            subject_exists = self.s.db.get(Certificate, subject_id) is not None
        elif subject_type == DisputeSubjectType.OPPORTUNITY:
            from app.models.csr import Opportunity

            subject_exists = self.s.db.get(Opportunity, subject_id) is not None
        if not subject_exists:
            raise NotFoundError("Disputed subject not found")

        against = self._resolve_against(subject_type, subject_id)
        if against == user.id:
            raise ValidationFailedError("You cannot file a dispute against yourself", code="self_dispute")

        dispute = self.s.disputes.add(
            Dispute(
                subject_type=subject_type,
                subject_id=subject_id,
                filed_by=user.id,
                against_user_id=against,
                summary=summary,
            )
        )
        AuditService(self.s).log(
            user.id, user.email, "dispute.filed", subject_type=subject_type.value, subject_id=subject_id
        )
        return dispute

    def list_my(self, user: User) -> list[Dispute]:
        return list(
            self.s.db.scalars(
                select(Dispute)
                .where(or_(Dispute.filed_by == user.id, Dispute.against_user_id == user.id))
                .order_by(Dispute.created_at.desc())
            ).all()
        )

    def list_open(self, skip: int = 0, limit: int = 50) -> list[Dispute]:
        return self.s.disputes.list_open(skip, limit)

    def get(self, user: User, dispute_id: UUID) -> Dispute:
        dispute = self.s.db.get(Dispute, dispute_id)
        if not dispute:
            raise NotFoundError("Dispute not found")
        if dispute.filed_by != user.id and dispute.against_user_id != user.id:
            raise NotFoundError("Dispute not found")
        return dispute

    def resolve(self, admin: User, dispute_id: UUID, decision: str) -> Dispute:
        dispute = self.s.db.get(Dispute, dispute_id)
        if not dispute:
            raise NotFoundError("Dispute not found")
        if dispute.status != DisputeStatus.OPEN:
            raise ValidationFailedError("Only open disputes can be resolved", code="dispute_not_open")
        dispute.status = DisputeStatus.RESOLVED
        dispute.decision = decision
        dispute.resolved_by = admin.id
        dispute.resolved_at = utcnow()
        AuditService(self.s).log(
            admin.id,
            admin.email,
            "dispute.resolved",
            subject_type=dispute.subject_type.value,
            subject_id=dispute.id,
            details={"decision": decision},
        )
        return dispute
