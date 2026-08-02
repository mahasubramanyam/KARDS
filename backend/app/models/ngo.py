from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DocSubjectType, DocType, DocValidationStatus, VerificationStatus
from app.models.types import enum_col, fk_col


class Document(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    subject_type: Mapped[DocSubjectType] = enum_col(DocSubjectType)
    subject_id: Mapped[UUID] = mapped_column(Uuid, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(120), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    uploaded_by: Mapped[UUID] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    doc_type: Mapped[DocType | None] = enum_col(DocType, nullable=True)
    validation_status: Mapped[DocValidationStatus | None] = enum_col(DocValidationStatus, nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_by: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("ix_documents_subject", "subject_type", "subject_id"),)


class VerificationRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "verification_requests"

    ngo_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    status: Mapped[VerificationStatus] = enum_col(VerificationStatus, default=VerificationStatus.PENDING)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reviewed_by: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decision_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (Index("ix_verification_requests_ngo_status", "ngo_user_id", "status"),)


class CsrScore(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "csr_scores"

    ngo_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    documents_weight: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    operations_weight: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    past_performance_weight: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    governance_weight: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    computed_by: Mapped[UUID] = fk_col("users.id", ondelete="SET NULL", nullable=True)

    __table_args__ = (Index("ix_csr_scores_ngo", "ngo_user_id", "created_at"),)
