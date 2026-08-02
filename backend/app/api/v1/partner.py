from fastapi import APIRouter

from app.api.deps import PARTNER_KEY, SERVICES
from app.models.partner import ApiKey
from app.schemas.auth import CompanyProfileOut
from app.schemas.domain import OpportunityOut, ProjectOut
from app.services.container import Services

router = APIRouter(prefix="/partner", tags=["partner"])


def _company(services: Services, key: ApiKey):
    return services.companies.by_user(key.company_user_id)


@router.get("/me", response_model=CompanyProfileOut)
def partner_profile(key: PARTNER_KEY, services: SERVICES) -> CompanyProfileOut:
    profile = _company(services, key)
    return CompanyProfileOut.model_validate(profile)


@router.get("/projects", response_model=list[ProjectOut])
def partner_projects(key: PARTNER_KEY, services: SERVICES) -> list[ProjectOut]:
    projects = services.projects.list_for_company(key.company_user_id)
    return [ProjectOut.model_validate(p) for p in projects]


@router.get("/opportunities", response_model=list[OpportunityOut])
def partner_opportunities(key: PARTNER_KEY, services: SERVICES) -> list[OpportunityOut]:
    from app.models.csr import Opportunity
    from sqlalchemy import select

    from app.models.csr import Project

    rows = services.db.scalars(
        select(Opportunity)
        .join(Project, Project.id == Opportunity.project_id)
        .where(
            Project.company_user_id == key.company_user_id,
            Opportunity.status.in_(["published", "in_progress", "completed"]),
        )
        .order_by(Opportunity.created_at.desc())
        .limit(200)
    ).all()
    return [OpportunityOut.model_validate(o) for o in rows]


@router.get("/certificates")
def partner_certificates(key: PARTNER_KEY, services: SERVICES) -> list[dict]:
    from sqlalchemy import select

    from app.models.certificate import Certificate
    from app.models.csr import Opportunity, Project
    from app.models.user import User

    rows = services.db.execute(
        select(
            Certificate.code,
            User.full_name,
            Opportunity.title,
            Certificate.hours_total,
            Certificate.issued_at,
            Certificate.status,
        )
        .select_from(Certificate)
        .join(Opportunity, Opportunity.id == Certificate.opportunity_id)
        .join(Project, Project.id == Opportunity.project_id)
        .join(User, User.id == Certificate.volunteer_id)
        .where(Project.company_user_id == key.company_user_id)
        .order_by(Certificate.issued_at.desc())
        .limit(200)
    ).all()
    return [
        {
            "code": code,
            "volunteer_name": name,
            "opportunity_title": title,
            "hours_total": float(hours),
            "issued_at": issued_at.isoformat(),
            "status": status,
        }
        for code, name, title, hours, issued_at, status in rows
    ]
