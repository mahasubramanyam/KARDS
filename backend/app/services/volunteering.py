from datetime import date
from uuid import UUID

from sqlalchemy import func, select

from app.core import security
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.models.certificate import Certificate
from app.models.csr import Opportunity
from app.models.enums import (
    ApplicationStatus,
    CertificateStatus,
    CertificateTemplate,
    NotificationType,
    OpportunityStatus,
    Role,
    WorkLogStatus,
)
from app.models.user import User
from app.models.volunteering import Application, WorkLog
from app.schemas.api import CertificatePublic
from app.services.audit import AuditService
from app.services.container import Services
from app.services.notifications import NotificationService


class VolunteeringService:
    def __init__(self, services: Services) -> None:
        self.s = services

    # ---- applications ----
    def apply(self, volunteer: User, opportunity_id: UUID, cover_note: str | None) -> Application:
        require(Role.VOLUNTEER, Permission.APPLY_TO_OPPORTUNITY)
        opportunity = self.s.opportunities.get_published(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity is not available")
        if opportunity.slots_filled >= opportunity.slots_total:
            raise ConflictError("All volunteer slots are filled", code="slots_full")
        existing = self.s.applications.by_opportunity_volunteer(opportunity_id, volunteer.id)
        if existing:
            raise ConflictError("You have already applied to this opportunity", code="already_applied")

        application = self.s.applications.add(
            Application(
                opportunity_id=opportunity_id,
                volunteer_id=volunteer.id,
                cover_note=cover_note,
                applied_at=utcnow(),
            )
        )
        NotificationService(self.s).send(
            opportunity.ngo_user_id,
            NotificationType.APPLICATION,
            "New volunteer application",
            f"{volunteer.full_name} applied to '{opportunity.title}'.",
            f"/app/ngo/projects",
        )
        AuditService(self.s).log(
            volunteer.id, volunteer.email, "application.created", subject_type="opportunity", subject_id=opportunity_id
        )
        return application

    def decide(self, ngo: User, application_id: UUID, accept: bool) -> Application:
        require(Role.NGO, Permission.MANAGE_OWN_APPLICATION)
        application = self.s.applications.get(application_id)
        if not application:
            raise NotFoundError("Application not found")
        opportunity = self.s.opportunities.get_active(application.opportunity_id)
        if not opportunity or opportunity.ngo_user_id != ngo.id:
            raise ForbiddenError("You can only review applications to your own opportunities")

        if application.status != ApplicationStatus.PENDING:
            raise ConflictError("Application already decided", code="already_decided")

        if accept and opportunity.slots_filled >= opportunity.slots_total:
            raise ConflictError("All volunteer slots are filled", code="slots_full")

        application.status = ApplicationStatus.ACCEPTED if accept else ApplicationStatus.REJECTED
        application.decided_at = utcnow()
        application.decided_by = ngo.id
        if accept:
            opportunity.slots_filled += 1
            if opportunity.slots_filled >= opportunity.slots_total:
                opportunity.status = OpportunityStatus.IN_PROGRESS

        NotificationService(self.s).send(
            application.volunteer_id,
            NotificationType.ACCEPTED if accept else NotificationType.REJECTED,
            "Application " + ("accepted" if accept else "not accepted"),
            f"Your application to '{opportunity.title}' was {'accepted' if accept else 'not accepted'}.",
            f"/app/volunteer/opportunities",
        )
        return application

    def withdraw(self, volunteer: User, application_id: UUID) -> Application:
        application = self.s.applications.get(application_id)
        if not application or application.volunteer_id != volunteer.id:
            raise NotFoundError("Application not found")
        if application.status != ApplicationStatus.PENDING:
            raise ConflictError("Only pending applications can be withdrawn", code="cannot_withdraw")
        application.status = ApplicationStatus.WITHDRAWN
        return application

    # ---- work logs ----
    def log_hours(self, volunteer: User, opportunity_id: UUID, log_date: date, hours: float, note: str | None) -> WorkLog:
        require(Role.VOLUNTEER, Permission.LOG_OWN_HOURS)
        opportunity = self.s.opportunities.get_active(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")
        if opportunity.status not in (OpportunityStatus.PUBLISHED, OpportunityStatus.IN_PROGRESS):
            raise ConflictError("Hours can only be logged for active opportunities", code="opportunity_not_active")

        application = self.s.applications.by_opportunity_volunteer(opportunity_id, volunteer.id)
        if not application or application.status != ApplicationStatus.ACCEPTED:
            raise ForbiddenError("You must be an accepted volunteer to log hours")

        existing = self.s.db.scalar(
            select(WorkLog).where(
                WorkLog.opportunity_id == opportunity_id,
                WorkLog.volunteer_id == volunteer.id,
                WorkLog.log_date == log_date,
            )
        )
        if existing:
            raise ConflictError("Hours already logged for this date", code="hours_already_logged")

        return self.s.worklogs.add(
            WorkLog(
                opportunity_id=opportunity_id,
                volunteer_id=volunteer.id,
                application_id=application.id,
                log_date=log_date,
                hours=hours,
                note=note,
                status=WorkLogStatus.PENDING,
            )
        )

    def approve_hours(self, ngo: User, worklog_id: UUID, approve: bool, note: str | None = None) -> WorkLog:
        require(Role.NGO, Permission.APPROVE_HOURS)
        worklog = self.s.worklogs.get(worklog_id)
        if not worklog:
            raise NotFoundError("Work log not found")
        opportunity = self.s.opportunities.get_active(worklog.opportunity_id)
        if not opportunity or opportunity.ngo_user_id != ngo.id:
            raise ForbiddenError("You can only approve hours for your own opportunities")

        if worklog.status != WorkLogStatus.PENDING:
            raise ConflictError("Work log already decided", code="already_decided")

        worklog.status = WorkLogStatus.APPROVED if approve else WorkLogStatus.REJECTED
        worklog.approved_by = ngo.id
        worklog.approved_at = utcnow()
        worklog.note = note or worklog.note

        NotificationService(self.s).send(
            worklog.volunteer_id,
            NotificationType.HOURS,
            "Hours " + ("approved" if approve else "rejected"),
            f"{worklog.hours}h on {worklog.log_date} was {'approved' if approve else 'not approved'}.",
            "/app/volunteer",
        )
        return worklog

    # ---- certificates ----
    def issue_certificate(self, ngo: User, opportunity_id: UUID, volunteer_id: UUID, template: str = "standard") -> Certificate:
        require(Role.NGO, Permission.MANAGE_OWN_OPPORTUNITY)
        opportunity = self.s.opportunities.get_active(opportunity_id)
        if not opportunity or opportunity.ngo_user_id != ngo.id:
            raise ForbiddenError("You can only issue certificates for your own opportunities")

        volunteer = self.s.users.by_id_active(volunteer_id)
        if not volunteer:
            raise NotFoundError("Volunteer not found")

        hours = self.s.worklogs.approved_hours_for_volunteer_opportunity(volunteer_id, opportunity_id)
        if hours <= 0:
            raise ValidationFailedError(
                "Cannot issue a certificate — no approved hours recorded", code="no_approved_hours"
            )

        existing = self.s.db.scalar(
            select(Certificate).where(
                Certificate.opportunity_id == opportunity_id,
                Certificate.volunteer_id == volunteer_id,
                Certificate.status == CertificateStatus.ISSUED,
            )
        )
        if existing:
            raise ConflictError("A certificate already exists for this volunteer and opportunity", code="certificate_exists")

        content_hash = security.certificate_content_hash(
            "|".join([volunteer.email, opportunity.id.hex, str(hours), utcnow().isoformat()])
        )
        certificate = self.s.certificates.add(
            Certificate(
                code=security.verification_code(),
                volunteer_id=volunteer_id,
                opportunity_id=opportunity_id,
                ngo_user_id=ngo.id,
                title=opportunity.title,
                hours_total=hours,
                issued_at=utcnow(),
                issued_by=ngo.id,
                template=template,
                content_hash=content_hash,
            )
        )
        NotificationService(self.s).send(
            volunteer_id,
            NotificationType.CERTIFICATE,
            "Certificate issued",
            f"A verified certificate for '{opportunity.title}' is now in your vault.",
            "/app/volunteer/certificates",
        )
        AuditService(self.s).log(
            ngo.id, ngo.email, "certificate.issued", subject_type="certificate", subject_id=certificate.id
        )
        return certificate

    def complete_opportunity(self, ngo: User, opportunity_id: UUID) -> Opportunity:
        opportunity = self.s.opportunities.get_active(opportunity_id)
        if not opportunity or opportunity.ngo_user_id != ngo.id:
            raise ForbiddenError("You can only manage your own opportunities")
        if opportunity.status != OpportunityStatus.IN_PROGRESS:
            raise ConflictError("Only in-progress opportunities can be completed", code="invalid_status")

        accepted = self.s.applications.list_for_opportunity(opportunity_id, ApplicationStatus.ACCEPTED.value)
        issued = 0
        for application in accepted:
            try:
                self.issue_certificate(ngo, opportunity_id, application.volunteer_id)
                issued += 1
            except (ConflictError, ValidationFailedError):
                continue
        opportunity.status = OpportunityStatus.COMPLETED
        AuditService(self.s).log(
            ngo.id, ngo.email, "opportunity.completed", subject_type="opportunity", subject_id=opportunity_id,
            details={"certificates_issued": issued},
        )
        return opportunity

    def list_certificates(self, volunteer: User) -> list[Certificate]:
        return self.s.certificates.list_for_volunteer(volunteer.id)

    def verify_public(self, code: str) -> CertificatePublic:
        certificate = self.s.certificates.by_code(code)
        if not certificate:
            return CertificatePublic(valid=False, code=code)
        volunteer = self.s.users.by_id_active(certificate.volunteer_id)
        canonical = "|".join(
            [
                certificate.title,
                str(float(certificate.hours_total)),
                certificate.issued_at.isoformat(),
                str(certificate.volunteer_id),
            ]
        )
        hash_ok = security.certificate_content_hash(canonical) == certificate.content_hash
        return CertificatePublic(
            valid=certificate.status == CertificateStatus.ISSUED and hash_ok,
            code=certificate.code,
            volunteer_name=volunteer.full_name if volunteer else None,
            opportunity_title=certificate.title,
            hours_total=float(certificate.hours_total),
            issued_at=certificate.issued_at,
            status=certificate.status,
            content_hash_verified=hash_ok,
        )
