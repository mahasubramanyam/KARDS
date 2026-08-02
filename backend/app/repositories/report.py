from datetime import date, datetime, time
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.csr import Opportunity, Project
from app.models.ngo import Document
from app.models.volunteering import WorkLog


class ReportQuery:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _scoped_opportunity_ids(self, company_user_id: UUID, project_id: UUID | None):
        q = (
            select(Opportunity.id)
            .join(Project, Project.id == Opportunity.project_id)
            .where(Project.company_user_id == company_user_id)
        )
        if project_id:
            q = q.where(Project.id == project_id)
        return q

    def has_data(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None) -> bool:
        hours, volunteers, _ = self.totals(company_user_id, period_start, period_end, project_id)
        expenses = self.expenses_total(period_start, period_end, project_id)
        return hours > 0 or volunteers > 0 or expenses > 0

    def totals(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None):
        scoped = self._scoped_opportunity_ids(company_user_id, project_id)
        rows = self.db.execute(
            select(
                func.coalesce(func.sum(WorkLog.hours), 0),
                func.count(func.distinct(WorkLog.volunteer_id)),
                func.count(func.distinct(Opportunity.ngo_user_id)),
            )
            .select_from(WorkLog)
            .join(Opportunity, Opportunity.id == WorkLog.opportunity_id)
            .where(
                WorkLog.status == "approved",
                WorkLog.log_date >= period_start,
                WorkLog.log_date <= period_end,
                Opportunity.id.in_(scoped),
            )
        ).one()
        hours, volunteers, ngos = rows
        return float(hours or 0), int(volunteers or 0), int(ngos or 0)

    def schedule_vii_breakdown(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None) -> dict:
        scoped = self._scoped_opportunity_ids(company_user_id, project_id)
        rows = self.db.execute(
            select(
                Opportunity.category,
                func.coalesce(func.sum(WorkLog.hours), 0),
                func.count(func.distinct(WorkLog.volunteer_id)),
            )
            .select_from(WorkLog)
            .join(Opportunity, Opportunity.id == WorkLog.opportunity_id)
            .where(
                WorkLog.status == "approved",
                WorkLog.log_date >= period_start,
                WorkLog.log_date <= period_end,
                Opportunity.id.in_(scoped),
            )
            .group_by(Opportunity.category)
        ).all()
        return {
            category.value: {"hours": float(hours or 0), "volunteers": int(volunteers or 0)}
            for category, hours, volunteers in rows
        }

    def expenses_total(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None) -> float:
        from app.models.enums import DocSubjectType

        scoped = self._scoped_opportunity_ids(company_user_id, project_id)
        docs = (
            select(Document.id)
            .join(Opportunity, Opportunity.id == Document.subject_id)
            .where(
                Document.subject_type == DocSubjectType.EXPENSE_RECEIPT,
                Document.created_at >= datetime.combine(period_start, time.min),
                Document.created_at <= datetime.combine(period_end, time.max),
                Opportunity.id.in_(scoped),
            )
        )
        # expense amounts are not yet captured as structured values; count receipts as evidence
        total = self.db.scalar(select(func.count()).select_from(docs.subquery()))
        return float(total or 0)

    def attendance_count(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None) -> int:
        from app.models.enums import DocSubjectType

        scoped = self._scoped_opportunity_ids(company_user_id, project_id)
        docs = (
            select(Document.id)
            .join(Opportunity, Opportunity.id == Document.subject_id)
            .where(
                Document.subject_type == DocSubjectType.ATTENDANCE_SHEET,
                Document.created_at >= datetime.combine(period_start, time.min),
                Document.created_at <= datetime.combine(period_end, time.max),
                Opportunity.id.in_(scoped),
            )
        )
        total = self.db.scalar(select(func.count()).select_from(docs.subquery()))
        return int(total or 0)

    def detail_rows(self, company_user_id: UUID, period_start: date, period_end: date, project_id: UUID | None = None, limit: int = 1000) -> list[dict]:
        scoped = self._scoped_opportunity_ids(company_user_id, project_id)
        rows = self.db.execute(
            select(
                Opportunity.title,
                WorkLog.log_date,
                WorkLog.hours,
                WorkLog.volunteer_id,
                Opportunity.category,
            )
            .select_from(WorkLog)
            .join(Opportunity, Opportunity.id == WorkLog.opportunity_id)
            .where(
                WorkLog.status == "approved",
                WorkLog.log_date >= period_start,
                WorkLog.log_date <= period_end,
                Opportunity.id.in_(scoped),
            )
            .order_by(WorkLog.log_date.asc())
            .limit(limit)
        ).all()
        return [
            {
                "opportunity": title,
                "date": log_date.isoformat(),
                "hours": float(hours),
                "volunteer_id": str(volunteer_id),
                "category": category.value,
            }
            for title, log_date, hours, volunteer_id, category in rows
        ]
