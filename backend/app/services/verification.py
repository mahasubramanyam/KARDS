from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError, ValidationFailedError
from app.core import security
from app.db.base import utcnow
from app.integrations.storage import get_storage
from app.models.enums import DocSubjectType, DocType, DocValidationStatus, NotificationType, VerificationStatus
from app.models.ngo import CsrScore, Document, VerificationRequest
from app.models.user import User
from app.schemas.domain import CsrScoreBreakdown
from app.services.audit import AuditService, RequestContext
from app.services.container import Services
from app.services.mail import MailService
from app.services.notifications import NotificationService


class VerificationService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def create_document(
        self,
        uploader: User,
        subject_type: DocSubjectType,
        subject_id: UUID,
        file_name: str,
        mime_type: str,
        size_bytes: int,
        sha256: str,
        data: bytes,
        doc_type: DocType | None = None,
    ) -> Document:
        if mime_type not in settings.allowed_upload_types:
            raise ValidationFailedError(f"File type {mime_type} is not allowed", code="unsupported_file_type")
        if size_bytes > settings.upload_max_bytes:
            raise ValidationFailedError("File exceeds the maximum allowed size", code="file_too_large")

        key = f"{subject_type.value}/{subject_id}/{security.verification_code(prefix='f')}.{self._extension(file_name)}"
        get_storage().put(key, data, mime_type)

        doc = self.s.documents.add(
            Document(
                subject_type=subject_type,
                subject_id=subject_id,
                storage_key=key,
                file_name=file_name,
                mime_type=mime_type,
                size_bytes=size_bytes,
                sha256=sha256,
                uploaded_by=uploader.id,
                doc_type=doc_type,
                validation_status=DocValidationStatus.PENDING if doc_type else None,
            )
        )
        AuditService(self.s).log(
            uploader.id, uploader.email, "document.uploaded", subject_type=subject_type.value, subject_id=subject_id
        )
        return doc

    def submit_for_verification(self, ngo: User, document_ids: list[UUID]) -> VerificationRequest:
        profile = self.s.ngos.by_user(ngo.id)
        if not profile:
            raise NotFoundError("NGO profile not found")
        if profile.status == VerificationStatus.VERIFIED:
            raise ConflictError("This NGO is already verified", code="already_verified")
        if profile.status == VerificationStatus.PENDING:
            raise ConflictError("A verification request is already in review", code="verification_pending")

        docs = self.s.documents.list_for_subject(DocSubjectType.NGO_VERIFICATION.value, ngo.id)
        by_id = {d.id: d for d in docs}
        missing = [did for did in document_ids if did not in by_id]
        if missing:
            raise NotFoundError("One or more documents were not found")

        for did in document_ids:
            doc = by_id[did]
            if not doc.doc_type:
                raise ValidationFailedError("Verification documents must declare a document type", code="doc_type_required")

        request = self.s.verifications.add(
            VerificationRequest(
                ngo_user_id=ngo.id,
                status=VerificationStatus.PENDING,
                submitted_at=utcnow(),
            )
        )
        profile.status = VerificationStatus.PENDING
        for did in document_ids:
            by_id[did].validation_status = DocValidationStatus.PENDING
        AuditService(self.s).log(
            ngo.id, ngo.email, "verification.submitted", subject_type="ngo", subject_id=ngo.id
        )
        return request

    def queue(self, skip: int = 0, limit: int = 50) -> list[VerificationRequest]:
        from sqlalchemy import select

        return list(
            self.s.db.scalars(
                select(VerificationRequest)
                .where(VerificationRequest.status == "pending")
                .order_by(VerificationRequest.submitted_at.asc())
                .offset(skip)
                .limit(limit)
            ).all()
        )

    def queue_count(self) -> int:
        return self.s.verifications.pending_count()

    def review(self, admin: User, request_id: UUID, approve: bool, reason: str, context: RequestContext | None = None) -> VerificationRequest:
        request = self.s.verifications.get(request_id)
        if not request:
            raise NotFoundError("Verification request not found")
        if request.status != "pending":
            raise ConflictError("Request already reviewed", code="already_reviewed")

        profile = self.s.ngos.by_user(request.ngo_user_id)
        if not profile:
            raise NotFoundError("NGO profile not found")

        if approve:
            profile.status = VerificationStatus.VERIFIED
            profile.verified_at = utcnow()
            for doc in self.s.documents.list_for_subject(DocSubjectType.NGO_VERIFICATION.value, request.ngo_user_id):
                if doc.doc_type:
                    doc.validation_status = DocValidationStatus.VALID
                    doc.validated_at = utcnow()
                    doc.validated_by = admin.id
            score = self.compute_score(request.ngo_user_id, admin.id)
        else:
            profile.status = VerificationStatus.REJECTED
            for doc in self.s.documents.list_for_subject(DocSubjectType.NGO_VERIFICATION.value, request.ngo_user_id):
                if doc.doc_type:
                    doc.validation_status = DocValidationStatus.INVALID
                    doc.validated_at = utcnow()
                    doc.validated_by = admin.id
                    doc.rejection_reason = reason

        request.status = VerificationStatus.VERIFIED if approve else VerificationStatus.REJECTED
        request.reviewed_by = admin.id
        request.reviewed_at = utcnow()
        request.decision_reason = reason

        ngo_user = self.s.users.by_id_active(request.ngo_user_id)
        if ngo_user:
            self._notify_ngo(ngo_user, approve, reason)

        AuditService(self.s).log(
            admin.id,
            admin.email,
            f"verification.{'approved' if approve else 'rejected'}",
            subject_type="ngo",
            subject_id=request.ngo_user_id,
            details={"reason": reason},
            context=context,
        )
        return request

    def _notify_ngo(self, ngo: User, approve: bool, reason: str) -> None:
        mail = MailService(self.s)
        notif = NotificationService(self.s)
        if approve:
            score = self.s.scores.latest_for_ngo(ngo.id)
            subject = "Your NGO is verified on Kards"
            body = f"Congratulations! Your NGO is now verified and CSR-ready. CSR-Ready Score: {score.total if score else 'n/a'}."
            mail.send(ngo.email, subject, body)
            notif.send(ngo.id, NotificationType.VERIFICATION, "NGO verified", body, "/app/ngo")
        else:
            subject = "NGO verification update — action required"
            body = f"Your verification was not approved: {reason}"
            mail.send(ngo.email, subject, body)
            notif.send(ngo.id, NotificationType.VERIFICATION, "Verification not approved", body, "/app/ngo/verification")

    def compute_score(self, ngo_user_id: UUID, computed_by: UUID | None = None) -> CsrScore:
        docs = self.s.documents.list_for_subject(DocSubjectType.NGO_VERIFICATION.value, ngo_user_id)
        valid_types = {d.doc_type for d in docs if d.validation_status == DocValidationStatus.VALID and d.doc_type}

        doc_points = 0.0
        weights = {
            DocType.FORM_12A: 12.0,
            DocType.FORM_80G: 12.0,
            DocType.PAN: 6.0,
            DocType.NITI_AAYOG: 5.0,
            DocType.FCRA: 5.0,
            DocType.OTHER: 0.0,
        }
        for dtype, pts in weights.items():
            if dtype in valid_types:
                doc_points += pts

        profile = self.s.ngos.by_user(ngo_user_id)
        present_fields = sum(
            1
            for f in ("org_name", "reg_number", "address", "city", "state", "pincode", "website", "description", "founded_year")
            if getattr(profile, f, None)
        )
        operations_points = min(30.0, present_fields / 9.0 * 30.0)

        from app.repositories.report import ReportQuery
        from app.models.csr import Opportunity
        from app.models.volunteering import WorkLog
        from sqlalchemy import func, select

        completed = self.s.db.scalar(
            select(func.count(func.distinct(Opportunity.id)))
            .select_from(Opportunity)
            .join(WorkLog, WorkLog.opportunity_id == Opportunity.id)
            .where(
                Opportunity.ngo_user_id == ngo_user_id,
                WorkLog.status == "approved",
            )
        )
        performance_points = min(20.0, (completed or 0) * 5.0)

        from sqlalchemy import select as _s
        from app.models.dispute import Dispute

        open_disputes = int(
            self.s.db.scalar(_s(func.count()).select_from(Dispute).where(Dispute.status == "open")) or 0
        )
        governance_points = 10.0 if open_disputes == 0 else max(0.0, 10.0 - 5.0 * open_disputes)

        total = round(doc_points + operations_points + performance_points + governance_points, 2)
        score = self.s.scores.add(
            CsrScore(
                ngo_user_id=ngo_user_id,
                documents_weight=round(doc_points, 2),
                operations_weight=round(operations_points, 2),
                past_performance_weight=round(performance_points, 2),
                governance_weight=round(governance_points, 2),
                total=total,
                computed_by=computed_by,
            )
        )
        return score

    def breakdown(self, ngo_user_id: UUID) -> CsrScoreBreakdown:
        score = self.s.scores.latest_for_ngo(ngo_user_id)
        if not score:
            return CsrScoreBreakdown(
                documents_weight=0, operations_weight=0, past_performance_weight=0, governance_weight=0, total=0
            )
        return CsrScoreBreakdown(
            documents_weight=float(score.documents_weight),
            operations_weight=float(score.operations_weight),
            past_performance_weight=float(score.past_performance_weight),
            governance_weight=float(score.governance_weight),
            total=float(score.total),
        )

    @staticmethod
    def _extension(file_name: str) -> str:
        return file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
