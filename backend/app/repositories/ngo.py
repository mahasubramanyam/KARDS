from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ngo import CsrScore, Document, VerificationRequest
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Document)

    def list_for_subject(self, subject_type: str, subject_id) -> list[Document]:
        return list(
            self.db.scalars(
                select(Document)
                .where(Document.subject_type == subject_type, Document.subject_id == subject_id)
                .order_by(Document.created_at.desc())
            ).all()
        )

    def by_id_and_subject(self, doc_id, subject_type: str, subject_id) -> Document | None:
        return self.db.scalar(
            select(Document).where(
                Document.id == doc_id, Document.subject_type == subject_type, Document.subject_id == subject_id
            )
        )


class VerificationRequestRepository(BaseRepository[VerificationRequest]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, VerificationRequest)

    def latest_for_ngo(self, ngo_user_id) -> VerificationRequest | None:
        return self.db.scalar(
            select(VerificationRequest)
            .where(VerificationRequest.ngo_user_id == ngo_user_id)
            .order_by(VerificationRequest.created_at.desc())
            .limit(1)
        )

    def pending_count(self) -> int:
        return self.count(VerificationRequest.status == "pending")


class CsrScoreRepository(BaseRepository[CsrScore]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CsrScore)

    def latest_for_ngo(self, ngo_user_id) -> CsrScore | None:
        return self.db.scalar(
            select(CsrScore)
            .where(CsrScore.ngo_user_id == ngo_user_id)
            .order_by(CsrScore.created_at.desc())
            .limit(1)
        )
