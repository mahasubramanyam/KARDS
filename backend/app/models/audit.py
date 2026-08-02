from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, DateTime, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import AuditSeverity
from app.models.types import enum_col, fk_col


class AuditLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    actor_id: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    actor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    action: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    subject_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    subject_id: Mapped[UUID | None] = mapped_column(Uuid, nullable=True)
    details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    severity: Mapped[AuditSeverity] = enum_col(AuditSeverity, default=AuditSeverity.INFO)

    __table_args__ = (
        Index("ix_audit_actor_time", "actor_id", "created_at"),
        Index("ix_audit_subject", "subject_type", "subject_id"),
    )
