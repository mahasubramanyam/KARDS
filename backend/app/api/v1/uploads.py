import hashlib
from uuid import UUID

from fastapi import APIRouter, File, Form, UploadFile

from app.api.deps import CURRENT_USER, SERVICES
from app.core.config import settings
from app.core.exceptions import ForbiddenError, NotFoundError, ValidationFailedError
from app.models.enums import DocSubjectType, DocType
from app.schemas.domain import DocumentOut
from app.services.container import Services
from app.services.verification import VerificationService

router = APIRouter(prefix="/uploads", tags=["uploads"])

_ALLOWED_UPLOAD_SUBJECTS = {
    DocSubjectType.PROJECT_EVIDENCE,
    DocSubjectType.EXPENSE_RECEIPT,
    DocSubjectType.ATTENDANCE_SHEET,
    DocSubjectType.MESSAGE_ATTACHMENT,
}


def _authorize_subject(services: Services, user, subject_type: DocSubjectType, subject_id: UUID) -> None:
    from app.models.csr import Opportunity, Project
    from app.models.messaging import Thread

    if subject_type == DocSubjectType.PROJECT_EVIDENCE:
        project = services.db.get(Project, subject_id)
        if not project or project.company_user_id != user.id:
            raise ForbiddenError("You can only upload evidence for your own projects")
    elif subject_type in (DocSubjectType.EXPENSE_RECEIPT, DocSubjectType.ATTENDANCE_SHEET):
        opportunity = services.db.get(Opportunity, subject_id)
        if not opportunity:
            raise NotFoundError("Opportunity not found")
        if opportunity.ngo_user_id != user.id:
            raise ForbiddenError("You can only upload evidence for your own opportunities")
    elif subject_type == DocSubjectType.MESSAGE_ATTACHMENT:
        thread = services.db.get(Thread, subject_id)
        if not thread or not services.participants.by_thread_user(thread.id, user.id):
            raise ForbiddenError("You can only attach files to threads you participate in")


@router.post("", response_model=DocumentOut, status_code=201)
async def upload(
    services: SERVICES,
    user: CURRENT_USER,
    subject_type: DocSubjectType = Form(...),
    subject_id: UUID = Form(...),
    doc_type: DocType | None = Form(default=None),
    file: UploadFile = File(...),
) -> DocumentOut:
    if subject_type not in _ALLOWED_UPLOAD_SUBJECTS:
        raise ValidationFailedError("This upload endpoint only accepts evidence and attachment documents", code="invalid_subject")
    _authorize_subject(services, user, subject_type, subject_id)

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
