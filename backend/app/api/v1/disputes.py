from uuid import UUID

from fastapi import APIRouter

from app.api.deps import ADMIN_USER, CURRENT_USER, SERVICES
from app.models.enums import DisputeSubjectType
from app.schemas.api import DisputeCreate, DisputeOut, DisputeResolve
from app.schemas.common import Page
from app.services.container import Services
from app.services.disputes import DisputeService

router = APIRouter(prefix="/disputes", tags=["disputes"])


@router.post("", response_model=DisputeOut, status_code=201)
def file_dispute(user: CURRENT_USER, services: SERVICES, payload: DisputeCreate) -> DisputeOut:
    dispute = DisputeService(services).file_dispute(
        user, DisputeSubjectType(payload.subject_type), payload.subject_id, payload.summary
    )
    return DisputeOut.model_validate(dispute)


@router.get("/mine", response_model=list[DisputeOut])
def my_disputes(user: CURRENT_USER, services: SERVICES) -> list[DisputeOut]:
    return [DisputeOut.model_validate(d) for d in DisputeService(services).list_my(user)]


@router.get("/{dispute_id}", response_model=DisputeOut)
def get_dispute(dispute_id: UUID, user: CURRENT_USER, services: SERVICES) -> DisputeOut:
    return DisputeOut.model_validate(DisputeService(services).get(user, dispute_id))


@router.get("/admin/queue", response_model=Page[DisputeOut])
def dispute_queue(
    admin: ADMIN_USER, services: SERVICES, skip: int = 0, limit: int = 50
) -> Page[DisputeOut]:
    items = DisputeService(services).list_open(skip, limit)
    from app.models.dispute import Dispute

    total = services.disputes.count(Dispute.status == "open")
    return Page(
        items=[DisputeOut.model_validate(d) for d in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/admin/{dispute_id}/resolve", response_model=DisputeOut)
def resolve_dispute(
    dispute_id: UUID,
    payload: DisputeResolve,
    admin: ADMIN_USER,
    services: SERVICES,
) -> DisputeOut:
    return DisputeOut.model_validate(DisputeService(services).resolve(admin, dispute_id, payload.decision))
