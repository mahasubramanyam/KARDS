from fastapi import APIRouter, Query

from app.api.deps import SERVICES
from app.schemas.api import CertificatePublic
from app.schemas.common import Page
from app.schemas.domain import OpportunityOut
from app.services.container import Services
from app.services.volunteering import VolunteeringService

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/opportunities", response_model=Page[OpportunityOut])
def list_opportunities(
    services: SERVICES,
    category: str | None = None,
    remote: bool | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> Page[OpportunityOut]:
    filters = {"category": category, "remote": remote, "search": search}
    items = services.opportunities.list_public(skip, limit, filters)
    total = services.opportunities.count_public(filters)
    return Page(
        items=[OpportunityOut.model_validate(o) for o in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id, services: SERVICES) -> OpportunityOut:
    opportunity = services.opportunities.get_published(opportunity_id)
    from app.core.exceptions import NotFoundError

    if not opportunity:
        raise NotFoundError("Opportunity not found")
    return OpportunityOut.model_validate(opportunity)


@router.get("/certificates/verify", response_model=CertificatePublic)
def verify_certificate(services: SERVICES, code: str = Query(min_length=1)) -> CertificatePublic:
    return VolunteeringService(services).verify_public(code)
