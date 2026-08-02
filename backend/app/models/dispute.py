from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DisputeStatus, DisputeSubjectType
from app.models.types import enum_col, fk_col


class Dispute(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "disputes"

    subject_type: Mapped[DisputeSubjectType] = enum_col(DisputeSubjectType)
    subject_id: Mapped[UUID] = mapped_column(Uuid, nullable=False)
    filed_by: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    against_user_id: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DisputeStatus] = enum_col(DisputeStatus, default=DisputeStatus.OPEN)
    decision: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_disputes_status", "status", "created_at"),)
