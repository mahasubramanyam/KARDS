from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CURRENT_USER, SERVICES
from app.models.user import User
from app.schemas.common import Page
from app.schemas.domain import (
    AllocationOut,
    BudgetCreate,
    BudgetOut,
    OpportunityCreate,
    OpportunityOut,
    OpportunityUpdate,
    PartnershipInvite,
    PartnershipOut,
    PartnershipRespond,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
)
from app.services.container import Services
from app.services.csr import CsrService

router = APIRouter(prefix="/csr", tags=["csr"])


@router.put("/budget", response_model=BudgetOut)
def upsert_budget(user: CURRENT_USER, services: SERVICES, payload: BudgetCreate) -> BudgetOut:
    budget = CsrService(services).create_or_update_budget(user, payload)
    return BudgetOut.model_validate(budget)


@router.get("/budgets", response_model=list[BudgetOut])
def list_budgets(user: CURRENT_USER, services: SERVICES) -> list[BudgetOut]:
    return [BudgetOut.model_validate(b) for b in CsrService(services).list_budgets(user)]


@router.get("/budgets/{budget_id}/allocations", response_model=list[AllocationOut])
def list_allocations(budget_id: UUID, user: CURRENT_USER, services: SERVICES) -> list[AllocationOut]:
    return [AllocationOut.model_validate(a) for a in CsrService(services).list_allocations(budget_id)]


@router.post("/projects", response_model=ProjectOut, status_code=201)
def create_project(user: CURRENT_USER, services: SERVICES, payload: ProjectCreate) -> ProjectOut:
    project = CsrService(services).create_project(user, payload)
    return ProjectOut.model_validate(project)


@router.get("/projects", response_model=Page[ProjectOut])
def list_projects(
    user: CURRENT_USER, services: SERVICES, status: str | None = None, skip: int = 0, limit: int = 50
) -> Page[ProjectOut]:
    items = services.projects.list_for_company(user.id, status, skip, limit)
    total = services.projects.count_for_company(user.id)
    return Page(
        items=[ProjectOut.model_validate(p) for p in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: UUID, user: CURRENT_USER, services: SERVICES) -> ProjectOut:
    project = CsrService(services)._project_for_company(user, project_id)
    return ProjectOut.model_validate(project)


@router.patch("/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: UUID, user: CURRENT_USER, services: SERVICES, payload: ProjectUpdate) -> ProjectOut:
    project = CsrService(services).update_project(user, project_id, payload)
    return ProjectOut.model_validate(project)


@router.post("/projects/{project_id}/activate", response_model=ProjectOut)
def activate_project(project_id: UUID, user: CURRENT_USER, services: SERVICES) -> ProjectOut:
    return ProjectOut.model_validate(CsrService(services).activate_project(user, project_id))


@router.post("/projects/{project_id}/complete", response_model=ProjectOut)
def complete_project(project_id: UUID, user: CURRENT_USER, services: SERVICES) -> ProjectOut:
    return ProjectOut.model_validate(CsrService(services).complete_project(user, project_id))


@router.post("/projects/{project_id}/invite", response_model=PartnershipOut, status_code=201)
def invite_ngo(project_id: UUID, user: CURRENT_USER, services: SERVICES, payload: PartnershipInvite) -> PartnershipOut:
    partnership = CsrService(services).invite_ngo(user, project_id, payload)
    return PartnershipOut.model_validate(partnership)


@router.get("/projects/{project_id}/partnerships", response_model=list[PartnershipOut])
def project_partnerships(project_id: UUID, user: CURRENT_USER, services: SERVICES) -> list[PartnershipOut]:
    partnerships = services.partnerships.for_project(project_id)
    return [PartnershipOut.model_validate(p) for p in partnerships]


@router.get("/partnerships", response_model=list[PartnershipOut])
def my_partnerships(user: CURRENT_USER, services: SERVICES, status: str | None = None) -> list[PartnershipOut]:
    partnerships = CsrService(services).list_partnerships_for_ngo(user, status)
    return [PartnershipOut.model_validate(p) for p in partnerships]


@router.post("/partnerships/{partnership_id}/respond", response_model=PartnershipOut)
def respond_partnership(
    partnership_id: UUID, user: CURRENT_USER, services: SERVICES, payload: PartnershipRespond
) -> PartnershipOut:
    partnership = CsrService(services).respond_partnership(user, partnership_id, payload)
    return PartnershipOut.model_validate(partnership)


@router.post("/opportunities", response_model=OpportunityOut, status_code=201)
def create_opportunity(user: CURRENT_USER, services: SERVICES, payload: OpportunityCreate) -> OpportunityOut:
    opportunity = CsrService(services).create_opportunity(user, payload)
    return OpportunityOut.model_validate(opportunity)


@router.get("/opportunities", response_model=Page[OpportunityOut])
def my_opportunities(
    user: CURRENT_USER, services: SERVICES, status: str | None = None, skip: int = 0, limit: int = 50
) -> Page[OpportunityOut]:
    items = services.opportunities.list_for_ngo(user.id, status, skip, limit)
    from app.models.csr import Opportunity

    clauses = [Opportunity.ngo_user_id == user.id]
    if status:
        clauses.append(Opportunity.status == status)
    total = services.opportunities.count(*clauses)
    return Page(
        items=[OpportunityOut.model_validate(o) for o in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: UUID, user: CURRENT_USER, services: SERVICES) -> OpportunityOut:
    opportunity = CsrService(services)._opportunity_for_ngo(user, opportunity_id)
    return OpportunityOut.model_validate(opportunity)


@router.patch("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(
    opportunity_id: UUID, user: CURRENT_USER, services: SERVICES, payload: OpportunityUpdate
) -> OpportunityOut:
    opportunity = CsrService(services).update_opportunity(user, opportunity_id, payload)
    return OpportunityOut.model_validate(opportunity)


@router.post("/opportunities/{opportunity_id}/publish", response_model=OpportunityOut)
def publish_opportunity(opportunity_id: UUID, user: CURRENT_USER, services: SERVICES) -> OpportunityOut:
    return OpportunityOut.model_validate(CsrService(services).publish_opportunity(user, opportunity_id))


@router.post("/opportunities/{opportunity_id}/close", response_model=OpportunityOut)
def close_opportunity(opportunity_id: UUID, user: CURRENT_USER, services: SERVICES) -> OpportunityOut:
    return OpportunityOut.model_validate(CsrService(services).close_opportunity(user, opportunity_id))
