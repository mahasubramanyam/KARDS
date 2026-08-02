from uuid import UUID

from sqlalchemy import select

from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.models.enums import ReportKind, ReportStatus, Role
from app.models.report import Report
from app.models.user import User
from app.schemas.api import ReportRequest, ReportFinalize
from app.services.audit import AuditService
from app.services.container import Services
from app.workers.reports import generate_report


class ReportService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def create(self, company: User, payload: ReportRequest) -> Report:
        require(Role.COMPANY, Permission.GENERATE_REPORTS)
        if payload.period_start > payload.period_end:
            raise ValidationFailedError("period_start must be before period_end", code="invalid_period")

        if payload.project_id:
            project = self.s.projects.get_active(payload.project_id)
            if not project or project.company_user_id != company.id:
                raise NotFoundError("Project not found")

        has_data = self.s.report_query.has_data(
            company.id, payload.period_start, payload.period_end, payload.project_id
        )
        if not has_data:
            raise ValidationFailedError(
                "No report data available for this period. Add and approve volunteer hours or upload attendance/expense evidence first.",
                code="no_report_data",
            )

        report = Report(
            kind=payload.kind,
            company_user_id=company.id,
            project_id=payload.project_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            status=ReportStatus.QUEUED,
            generated_by=company.id,
        )
        self.s.db.add(report)
        self.s.db.flush()

        generate_report.delay(str(report.id))
        AuditService(self.s).log(
            company.id, company.email, "report.requested", subject_type="report", subject_id=report.id
        )
        return report

    def get(self, company: User, report_id: UUID) -> Report:
        report = self.s.db.get(Report, report_id)
        if not report or report.company_user_id != company.id:
            raise NotFoundError("Report not found")
        return report

    def list_for_company(self, company: User, skip: int = 0, limit: int = 50) -> list[Report]:
        return list(
            self.s.db.scalars(
                select(Report)
                .where(Report.company_user_id == company.id)
                .order_by(Report.created_at.desc())
                .offset(skip)
                .limit(limit)
            ).all()
        )

    def finalize(self, company: User, report_id: UUID, payload: ReportFinalize) -> Report:
        report = self.get(company, report_id)
        if report.status != ReportStatus.READY:
            raise ValidationFailedError("Only a ready report can be finalized", code="report_not_ready")
        report.is_final = True
        report.finalized_at = utcnow()
        return report
