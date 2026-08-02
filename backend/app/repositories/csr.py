from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.csr import CsrBudget, CsrBudgetAllocation, Opportunity, Project, ProjectPartnership
from app.repositories.base import BaseRepository


class CsrBudgetRepository(BaseRepository[CsrBudget]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CsrBudget)

    def by_company_year(self, company_user_id, fiscal_year: str) -> CsrBudget | None:
        return self.db.scalar(
            select(CsrBudget).where(
                CsrBudget.company_user_id == company_user_id, CsrBudget.fiscal_year == fiscal_year
            )
        )

    def list_for_company(self, company_user_id) -> list[CsrBudget]:
        return list(
            self.db.scalars(
                select(CsrBudget)
                .where(CsrBudget.company_user_id == company_user_id)
                .order_by(CsrBudget.fiscal_year.desc())
            ).all()
        )


class AllocationRepository(BaseRepository[CsrBudgetAllocation]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CsrBudgetAllocation)

    def list_for_budget(self, budget_id) -> list[CsrBudgetAllocation]:
        return list(
            self.db.scalars(select(CsrBudgetAllocation).where(CsrBudgetAllocation.budget_id == budget_id)).all()
        )

    def by_budget_category(self, budget_id, category: str) -> CsrBudgetAllocation | None:
        return self.db.scalar(
            select(CsrBudgetAllocation).where(
                CsrBudgetAllocation.budget_id == budget_id, CsrBudgetAllocation.category == category
            )
        )


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Project)

    def list_for_company(self, company_user_id, status: str | None = None, skip: int = 0, limit: int = 50):
        q = self.query().where(Project.company_user_id == company_user_id)
        if status:
            q = q.where(Project.status == status)
        return list(self.db.scalars(q.order_by(Project.created_at.desc()).offset(skip).limit(limit)).all())

    def count_for_company(self, company_user_id) -> int:
        return self.count(Project.company_user_id == company_user_id)


class PartnershipRepository(BaseRepository[ProjectPartnership]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ProjectPartnership)

    def for_project(self, project_id) -> list[ProjectPartnership]:
        return list(
            self.db.scalars(
                select(ProjectPartnership)
                .where(ProjectPartnership.project_id == project_id)
                .order_by(ProjectPartnership.created_at.desc())
            ).all()
        )

    def by_project_ngo(self, project_id, ngo_user_id) -> ProjectPartnership | None:
        return self.db.scalar(
            select(ProjectPartnership).where(
                ProjectPartnership.project_id == project_id, ProjectPartnership.ngo_user_id == ngo_user_id
            )
        )

    def list_for_ngo(self, ngo_user_id, status: str | None = None) -> list[ProjectPartnership]:
        q = select(ProjectPartnership).where(ProjectPartnership.ngo_user_id == ngo_user_id)
        if status:
            q = q.where(ProjectPartnership.status == status)
        return list(self.db.scalars(q.order_by(ProjectPartnership.created_at.desc())).all())


class OpportunityRepository(BaseRepository[Opportunity]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Opportunity)

    def _public_clauses(self, filters: dict):
        clauses = [Opportunity.status == "published"]
        filters = filters or {}
        if filters.get("category"):
            clauses.append(Opportunity.category == filters["category"])
        if filters.get("remote") is not None:
            clauses.append(Opportunity.is_remote == filters["remote"])
        if filters.get("search"):
            clauses.append(Opportunity.title.ilike(f"%{filters['search']}%"))
        return clauses

    def list_public(self, skip: int = 0, limit: int = 50, filters: dict | None = None) -> list[Opportunity]:
        q = self.query().where(*self._public_clauses(filters))
        return list(self.db.scalars(q.order_by(Opportunity.created_at.desc()).offset(skip).limit(limit)).all())

    def count_public(self, filters: dict | None = None) -> int:
        return self.count(*self._public_clauses(filters))

    def list_for_ngo(self, ngo_user_id, status: str | None = None, skip: int = 0, limit: int = 50):
        q = self.query().where(Opportunity.ngo_user_id == ngo_user_id)
        if status:
            q = q.where(Opportunity.status == status)
        return list(self.db.scalars(q.order_by(Opportunity.created_at.desc()).offset(skip).limit(limit)).all())

    def get_published(self, opportunity_id) -> Opportunity | None:
        return self.db.scalar(
            self.query().where(Opportunity.id == opportunity_id, Opportunity.status == "published")
        )
