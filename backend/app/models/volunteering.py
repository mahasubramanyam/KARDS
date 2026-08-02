from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ApplicationStatus, WorkLogStatus
from app.models.types import enum_col, fk_col


class Application(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "applications"

    opportunity_id: Mapped[UUID] = fk_col("opportunities.id", ondelete="CASCADE")
    volunteer_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    status: Mapped[ApplicationStatus] = enum_col(ApplicationStatus, default=ApplicationStatus.PENDING)
    cover_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    decided_by: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)

    __table_args__ = (
        UniqueConstraint("opportunity_id", "volunteer_id", name="uq_application_opportunity_volunteer"),
        Index("ix_applications_volunteer_status", "volunteer_id", "status"),
        Index("ix_applications_opportunity_status", "opportunity_id", "status"),
    )


class WorkLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "work_logs"

    opportunity_id: Mapped[UUID] = fk_col("opportunities.id", ondelete="CASCADE")
    volunteer_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    application_id: Mapped[UUID | None] = fk_col("applications.id", ondelete="SET NULL", nullable=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    hours: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WorkLogStatus] = enum_col(WorkLogStatus, default=WorkLogStatus.PENDING)
    approved_by: Mapped[UUID | None] = fk_col("users.id", ondelete="SET NULL", nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("opportunity_id", "volunteer_id", "log_date", name="uq_worklog_day"),
        Index("ix_worklogs_volunteer", "volunteer_id", "status"),
        Index("ix_worklogs_opportunity_status", "opportunity_id", "status"),
    )
