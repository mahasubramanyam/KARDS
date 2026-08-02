from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import CertificateStatus, CertificateTemplate
from app.models.types import enum_col, fk_col


class Certificate(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "certificates"

    code: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    volunteer_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    opportunity_id: Mapped[UUID] = fk_col("opportunities.id", ondelete="CASCADE")
    ngo_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    hours_total: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issued_by: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    template: Mapped[CertificateTemplate] = enum_col(CertificateTemplate, default=CertificateTemplate.STANDARD)
    status: Mapped[CertificateStatus] = enum_col(CertificateStatus, default=CertificateStatus.ISSUED)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)

    __table_args__ = (Index("ix_certificates_volunteer", "volunteer_id", "status"),)
