from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CURRENT_USER, SERVICES
from app.schemas.api import (
    ApplicationCreate,
    ApplicationDecision,
    ApplicationOut,
    CertificateOut,
    WorkLogCreate,
    WorkLogOut,
)
from app.schemas.domain import OpportunityOut
from app.schemas.common import Page
from app.services.container import Services
from app.services.volunteering import VolunteeringService

router = APIRouter(prefix="/volunteering", tags=["volunteering"])


@router.post("/applications", response_model=ApplicationOut, status_code=201)
def apply(user: CURRENT_USER, services: SERVICES, payload: ApplicationCreate) -> ApplicationOut:
    application = VolunteeringService(services).apply(user, payload.opportunity_id, payload.cover_note)
    return ApplicationOut.model_validate(application)


@router.get("/applications/mine", response_model=Page[ApplicationOut])
def my_applications(
    user: CURRENT_USER, services: SERVICES, status: str | None = None, skip: int = 0, limit: int = 50
) -> Page[ApplicationOut]:
    items = services.applications.list_for_volunteer(user.id, status, skip, limit)
    from app.models.volunteering import Application

    clauses = [Application.volunteer_id == user.id]
    if status:
        clauses.append(Application.status == status)
    total = services.applications.count(*clauses)
    return Page(
        items=[ApplicationOut.model_validate(a) for a in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/applications/{application_id}/withdraw", response_model=ApplicationOut)
def withdraw(application_id: UUID, user: CURRENT_USER, services: SERVICES) -> ApplicationOut:
    application = VolunteeringService(services).withdraw(user, application_id)
    return ApplicationOut.model_validate(application)


@router.get("/applications/opportunity/{opportunity_id}", response_model=Page[ApplicationOut])
def applications_for_opportunity(
    opportunity_id: UUID, user: CURRENT_USER, services: SERVICES, skip: int = 0, limit: int = 50
) -> Page[ApplicationOut]:
    items = services.applications.list_for_opportunity(opportunity_id, None, skip, limit)
    total = services.applications.count_for_opportunity(opportunity_id)
    return Page(
        items=[ApplicationOut.model_validate(a) for a in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/applications/{application_id}/decide", response_model=ApplicationOut)
def decide(application_id: UUID, user: CURRENT_USER, services: SERVICES, payload: ApplicationDecision) -> ApplicationOut:
    application = VolunteeringService(services).decide(user, application_id, payload.accept)
    return ApplicationOut.model_validate(application)


@router.post("/worklogs", response_model=WorkLogOut, status_code=201)
def log_hours(user: CURRENT_USER, services: SERVICES, payload: WorkLogCreate) -> WorkLogOut:
    worklog = VolunteeringService(services).log_hours(
        user, payload.opportunity_id, payload.log_date, payload.hours, payload.note
    )
    return WorkLogOut.model_validate(worklog)


@router.get("/worklogs/pending", response_model=Page[WorkLogOut])
def pending_worklogs(
    user: CURRENT_USER, services: SERVICES, skip: int = 0, limit: int = 50
) -> Page[WorkLogOut]:
    items = services.worklogs.pending_for_ngo(user.id, skip, limit)
    total = services.worklogs.pending_count_for_ngo(user.id)
    return Page(
        items=[WorkLogOut.model_validate(w) for w in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/worklogs/{worklog_id}/approve", response_model=WorkLogOut)
def approve_worklog(worklog_id: UUID, user: CURRENT_USER, services: SERVICES) -> WorkLogOut:
    worklog = VolunteeringService(services).approve_hours(user, worklog_id, True)
    return WorkLogOut.model_validate(worklog)


@router.post("/worklogs/{worklog_id}/reject", response_model=WorkLogOut)
def reject_worklog(worklog_id: UUID, user: CURRENT_USER, services: SERVICES) -> WorkLogOut:
    worklog = VolunteeringService(services).approve_hours(user, worklog_id, False)
    return WorkLogOut.model_validate(worklog)


@router.post("/opportunities/{opportunity_id}/certificates", response_model=CertificateOut, status_code=201)
def issue_certificate(
    opportunity_id: UUID, user: CURRENT_USER, services: SERVICES, volunteer_id: UUID
) -> CertificateOut:
    certificate = VolunteeringService(services).issue_certificate(user, opportunity_id, volunteer_id)
    return CertificateOut.model_validate(certificate)


@router.post("/opportunities/{opportunity_id}/complete", response_model=OpportunityOut)
def complete_opportunity(opportunity_id: UUID, user: CURRENT_USER, services: SERVICES) -> OpportunityOut:
    from app.schemas.domain import OpportunityOut

    opportunity = VolunteeringService(services).complete_opportunity(user, opportunity_id)
    return OpportunityOut.model_validate(opportunity)


@router.get("/certificates/mine", response_model=list[CertificateOut])
def my_certificates(user: CURRENT_USER, services: SERVICES) -> list[CertificateOut]:
    return [CertificateOut.model_validate(c) for c in VolunteeringService(services).list_certificates(user)]
