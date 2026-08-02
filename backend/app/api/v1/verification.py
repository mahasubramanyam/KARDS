import hashlib
from uuid import UUID

from fastapi import APIRouter, File, Form, Request, UploadFile

from app.api.deps import ADMIN_USER, CURRENT_USER, SERVICES, get_request_context
from app.core.config import settings
from app.core.exceptions import ValidationFailedError
from app.models.enums import DocSubjectType, DocType
from app.schemas.api import AdminNgoDecision
from app.schemas.common import Page
from app.schemas.domain import (
    CsrScoreBreakdown,
    CsrScoreOut,
    DocumentOut,
    VerificationRequestOut,
    VerificationSubmitRequest,
)
from app.services.verification import VerificationService

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    services: SERVICES,
    user: CURRENT_USER,
    subject_type: DocSubjectType = Form(...),
    subject_id: UUID = Form(...),
    doc_type: DocType | None = Form(default=None),
    file: UploadFile = File(...),
) -> DocumentOut:
    if subject_type == DocSubjectType.NGO_VERIFICATION and subject_id != user.id:
        raise ValidationFailedError("You can only upload documents for your own NGO", code="forbidden_subject")
    data = await file.read()
    size = len(data)
    if size > settings.upload_max_bytes:
        raise ValidationFailedError("File exceeds the maximum allowed size", code="file_too_large")
    mime = file.content_type or "application/octet-stream"
    if mime not in settings.allowed_upload_types:
        raise ValidationFailedError(f"File type {mime} is not allowed", code="unsupported_file_type")
    sha256 = hashlib.sha256(data).hexdigest()

    doc = VerificationService(services).create_document(
        uploader=user,
        subject_type=subject_type,
        subject_id=subject_id,
        file_name=file.filename or "upload.bin",
        mime_type=mime,
        size_bytes=size,
        sha256=sha256,
        data=data,
        doc_type=doc_type,
    )
    return DocumentOut.model_validate(doc)


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(user: CURRENT_USER, services: SERVICES) -> list[DocumentOut]:
    docs = services.documents.list_for_subject(DocSubjectType.NGO_VERIFICATION.value, user.id)
    return [DocumentOut.model_validate(d) for d in docs]


@router.post("/submit", response_model=VerificationRequestOut, status_code=201)
def submit(user: CURRENT_USER, services: SERVICES, payload: VerificationSubmitRequest) -> VerificationRequestOut:
    request = VerificationService(services).submit_for_verification(user, payload.document_ids)
    return VerificationRequestOut.model_validate(request)


@router.get("/status", response_model=VerificationRequestOut | None)
def my_status(user: CURRENT_USER, services: SERVICES) -> VerificationRequestOut | None:
    request = services.verifications.latest_for_ngo(user.id)
    return VerificationRequestOut.model_validate(request) if request else None


@router.get("/score", response_model=CsrScoreBreakdown)
def my_score(user: CURRENT_USER, services: SERVICES) -> CsrScoreBreakdown:
    return VerificationService(services).breakdown(user.id)


@router.get("/queue", response_model=Page[VerificationRequestOut])
def queue(
    admin: ADMIN_USER, services: SERVICES, skip: int = 0, limit: int = 50
) -> Page[VerificationRequestOut]:
    items = VerificationService(services).queue(skip, limit)
    total = VerificationService(services).queue_count()
    return Page(
        items=[VerificationRequestOut.model_validate(r) for r in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.post("/queue/{request_id}/review", response_model=VerificationRequestOut)
def review(
    request_id: UUID,
    payload: AdminNgoDecision,
    request: Request,
    admin: ADMIN_USER,
    services: SERVICES,
) -> VerificationRequestOut:
    result = VerificationService(services).review(
        admin, request_id, payload.approve, payload.reason, get_request_context(request)
    )
    return VerificationRequestOut.model_validate(result)


@router.get("/scores/{ngo_user_id}", response_model=CsrScoreOut | None)
def ngo_score(ngo_user_id: UUID, admin: ADMIN_USER, services: SERVICES) -> CsrScoreOut | None:
    score = services.scores.latest_for_ngo(ngo_user_id)
    return CsrScoreOut.model_validate(score) if score else None
