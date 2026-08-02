from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.volunteering import Application, WorkLog
from app.repositories.base import BaseRepository


class ApplicationRepository(BaseRepository[Application]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Application)

    def by_opportunity_volunteer(self, opportunity_id, volunteer_id) -> Application | None:
        return self.db.scalar(
            select(Application).where(
                Application.opportunity_id == opportunity_id, Application.volunteer_id == volunteer_id
            )
        )

    def list_for_volunteer(self, volunteer_id, status: str | None = None, skip: int = 0, limit: int = 50):
        q = self.query().where(Application.volunteer_id == volunteer_id)
        if status:
            q = q.where(Application.status == status)
        return list(self.db.scalars(q.order_by(Application.applied_at.desc()).offset(skip).limit(limit)).all())

    def list_for_opportunity(self, opportunity_id, status: str | None = None, skip: int = 0, limit: int = 50):
        q = self.query().where(Application.opportunity_id == opportunity_id)
        if status:
            q = q.where(Application.status == status)
        return list(self.db.scalars(q.order_by(Application.applied_at.desc()).offset(skip).limit(limit)).all())

    def count_for_opportunity(self, opportunity_id, status: str | None = None) -> int:
        clauses = [Application.opportunity_id == opportunity_id]
        if status:
            clauses.append(Application.status == status)
        return self.count(*clauses)


class WorkLogRepository(BaseRepository[WorkLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, WorkLog)

    def pending_for_ngo(self, ngo_user_id, skip: int = 0, limit: int = 50):
        from app.models.csr import Opportunity

        q = (
            select(WorkLog)
            .join(Opportunity, Opportunity.id == WorkLog.opportunity_id)
            .where(Opportunity.ngo_user_id == ngo_user_id, WorkLog.status == "pending")
        )
        return list(self.db.scalars(q.order_by(WorkLog.log_date.desc()).offset(skip).limit(limit)).all())

    def pending_count_for_ngo(self, ngo_user_id) -> int:
        from app.models.csr import Opportunity

        q = (
            select(func.count())
            .select_from(WorkLog)
            .join(Opportunity, Opportunity.id == WorkLog.opportunity_id)
            .where(Opportunity.ngo_user_id == ngo_user_id, WorkLog.status == "pending")
        )
        return int(self.db.scalar(q) or 0)

    def approved_hours_for_volunteer_opportunity(self, volunteer_id, opportunity_id) -> float:
        value = self.db.scalar(
            select(func.coalesce(func.sum(WorkLog.hours), 0)).where(
                WorkLog.volunteer_id == volunteer_id,
                WorkLog.opportunity_id == opportunity_id,
                WorkLog.status == "approved",
            )
        )
        return float(value or 0)

    def approved_hours_for_volunteer(self, volunteer_id) -> float:
        value = self.db.scalar(
            select(func.coalesce(func.sum(WorkLog.hours), 0)).where(
                WorkLog.volunteer_id == volunteer_id, WorkLog.status == "approved"
            )
        )
        return float(value or 0)
