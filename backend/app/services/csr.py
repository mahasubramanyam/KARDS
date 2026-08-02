from datetime import datetime
from uuid import UUID

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.models.csr import CsrBudget, CsrBudgetAllocation, Opportunity, Project, ProjectPartnership
from app.models.enums import (
    NotificationType,
    OpportunityStatus,
    PartnershipStatus,
    ProjectStatus,
    Role,
    ScheduleVII,
)
from app.models.user import User
from app.schemas.domain import (
    BudgetCreate,
    OpportunityCreate,
    OpportunityUpdate,
    PartnershipInvite,
    PartnershipRespond,
    ProjectCreate,
    ProjectUpdate,
)
from app.services.audit import AuditService
from app.services.container import Services
from app.services.notifications import NotificationService


class CsrService:
    def __init__(self, services: Services) -> None:
        self.s = services

    # ---- budgets ----
    def create_or_update_budget(self, company: User, payload: BudgetCreate) -> CsrBudget:
        require(Role.COMPANY, Permission.MANAGE_OWN_COMPANY)
        budget = self.s.budgets.by_company_year(company.id, payload.fiscal_year)
        if not budget:
            budget = self.s.budgets.add(
                CsrBudget(company_user_id=company.id, fiscal_year=payload.fiscal_year, total_amount=payload.total_amount)
            )
        else:
            budget.total_amount = payload.total_amount
            for alloc in self.s.allocations.list_for_budget(budget.id):
                self.s.db.delete(alloc)
            self.s.db.flush()

        allocated = 0.0
        for category, amount in payload.allocations.items():
            if amount < 0:
                raise ValidationFailedError("Allocation amounts cannot be negative", code="negative_allocation")
            allocated += amount
            self.s.allocations.add(
                CsrBudgetAllocation(budget_id=budget.id, category=category, amount=amount)
            )
        if allocated > budget.total_amount:
            raise ValidationFailedError(
                "Allocations exceed total budget", code="allocations_exceed_budget"
            )
        AuditService(self.s).log(
            company.id, company.email, "budget.upserted", subject_type="csr_budget", subject_id=budget.id
        )
        return budget

    def list_budgets(self, company: User) -> list[CsrBudget]:
        return self.s.budgets.list_for_company(company.id)

    def list_allocations(self, budget_id: UUID) -> list[CsrBudgetAllocation]:
        return self.s.allocations.list_for_budget(budget_id)

    # ---- projects ----
    def create_project(self, company: User, payload: ProjectCreate) -> Project:
        require(Role.COMPANY, Permission.CREATE_PROJECT)
        project = self.s.projects.add(
            Project(
                company_user_id=company.id,
                title=payload.title.strip(),
                description=payload.description,
                category=payload.category,
                start_date=payload.start_date,
                end_date=payload.end_date,
                budget_amount=payload.budget_amount,
                target_hours=payload.target_hours,
            )
        )
        AuditService(self.s).log(
            company.id, company.email, "project.created", subject_type="project", subject_id=project.id
        )
        return project

    def update_project(self, company: User, project_id: UUID, payload: ProjectUpdate) -> Project:
        project = self._project_for_company(company, project_id)
        for field in ("title", "description", "category", "start_date", "end_date", "budget_amount", "target_hours"):
            value = getattr(payload, field)
            if value is not None:
                setattr(project, field, value)
        AuditService(self.s).log(
            company.id, company.email, "project.updated", subject_type="project", subject_id=project.id
        )
        return project

    def activate_project(self, company: User, project_id: UUID) -> Project:
        project = self._project_for_company(company, project_id)
        if project.status != ProjectStatus.DRAFT:
            raise ConflictError("Only draft projects can be activated", code="project_not_draft")
        project.status = ProjectStatus.ACTIVE
        return project

    def complete_project(self, company: User, project_id: UUID) -> Project:
        project = self._project_for_company(company, project_id)
        if project.status != ProjectStatus.ACTIVE:
            raise ConflictError("Only active projects can be completed", code="project_not_active")
        project.status = ProjectStatus.COMPLETED
        return project

    def _project_for_company(self, company: User, project_id: UUID) -> Project:
        project = self.s.projects.get_active(project_id)
        if not project:
            raise NotFoundError("Project not found")
        if project.company_user_id != company.id:
            raise ForbiddenError()
        return project

    # ---- partnerships ----
    def invite_ngo(self, company: User, project_id: UUID, payload: PartnershipInvite) -> ProjectPartnership:
        project = self._project_for_company(company, project_id)
        if self.s.ngos.by_user(payload.ngo_user_id) is None:
            raise NotFoundError("NGO not found")
        existing = self.s.partnerships.by_project_ngo(project_id, payload.ngo_user_id)
        if existing:
            raise ConflictError("NGO already invited to this project", code="already_invited")
        partnership = self.s.partnerships.add(
            ProjectPartnership(
                project_id=project_id,
                ngo_user_id=payload.ngo_user_id,
                invited_by=company.id,
                message=payload.message,
            )
        )
        NotificationService(self.s).send(
            payload.ngo_user_id,
            NotificationType.PARTNERSHIP,
            "New project invitation",
            f"{company.full_name} invited your NGO to join project '{project.title}'.",
            f"/app/ngo/projects",
        )
        AuditService(self.s).log(
            company.id, company.email, "partnership.invited", subject_type="project", subject_id=project_id
        )
        return partnership

    def respond_partnership(self, ngo: User, partnership_id: UUID, payload: PartnershipRespond) -> ProjectPartnership:
        partnership = self.s.partnerships.get(partnership_id)
        if not partnership or partnership.ngo_user_id != ngo.id:
            raise NotFoundError("Partnership not found")
        if partnership.status != PartnershipStatus.INVITED:
            raise ConflictError("Partnership already responded", code="already_responded")
        partnership.status = PartnershipStatus.ACCEPTED if payload.accept else PartnershipStatus.DECLINED
        partnership.responded_at = utcnow()
        partnership.message = payload.message
        AuditService(self.s).log(
            ngo.id, ngo.email, "partnership.responded", subject_type="project_partnership", subject_id=partnership.id
        )
        return partnership

    def list_partnerships_for_ngo(self, ngo: User, status: str | None = None) -> list[ProjectPartnership]:
        return self.s.partnerships.list_for_ngo(ngo.id, status)

    # ---- opportunities ----
    def create_opportunity(self, ngo: User, payload: OpportunityCreate) -> Opportunity:
        require(Role.NGO, Permission.MANAGE_OWN_OPPORTUNITY)
        if payload.project_id:
            project = self.s.projects.get_active(payload.project_id)
            if not project or project.company_user_id != ngo.id:
                if not self.s.partnerships.by_project_ngo(payload.project_id, ngo.id):
                    raise ForbiddenError("NGO is not a partner on this project")
        opportunity = self.s.opportunities.add(
            Opportunity(
                ngo_user_id=ngo.id,
                project_id=payload.project_id,
                title=payload.title.strip(),
                description=payload.description,
                category=payload.category,
                location=payload.location,
                is_remote=payload.is_remote,
                start_date=payload.start_date,
                end_date=payload.end_date,
                slots_total=payload.slots_total,
                hours_estimate=payload.hours_estimate,
            )
        )
        AuditService(self.s).log(
            ngo.id, ngo.email, "opportunity.created", subject_type="opportunity", subject_id=opportunity.id
        )
        return opportunity

    def publish_opportunity(self, ngo: User, opportunity_id: UUID) -> Opportunity:
        opportunity = self._opportunity_for_ngo(ngo, opportunity_id)
        if opportunity.status != OpportunityStatus.DRAFT:
            raise ConflictError("Only draft opportunities can be published", code="opportunity_not_draft")
        opportunity.status = OpportunityStatus.PUBLISHED
        return opportunity

    def update_opportunity(self, ngo: User, opportunity_id: UUID, payload: OpportunityUpdate) -> Opportunity:
        opportunity = self._opportunity_for_ngo(ngo, opportunity_id)
        for field in ("title", "description", "category", "location", "is_remote", "start_date", "end_date", "slots_total", "hours_estimate", "project_id"):
            value = getattr(payload, field)
            if value is not None:
                setattr(opportunity, field, value)
        return opportunity

    def close_opportunity(self, ngo: User, opportunity_id: UUID) -> Opportunity:
        opportunity = self._opportunity_for_ngo(ngo, opportunity_id)
        if opportunity.status not in (OpportunityStatus.PUBLISHED, OpportunityStatus.IN_PROGRESS):
            raise ConflictError("Opportunity cannot be closed from its current state", code="invalid_status")
        opportunity.status = OpportunityStatus.CLOSED
        return opportunity

    def _opportunity_for_ngo(self, ngo: User, opportunity_id: UUID) -> Opportunity:
        opportunity = self.s.opportunities.get_active(opportunity_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")
        if opportunity.ngo_user_id != ngo.id:
            raise ForbiddenError()
        return opportunity
