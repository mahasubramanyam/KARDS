from datetime import date, datetime
from uuid import UUID

from sqlalchemy import JSON, Date, DateTime, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import ReportKind, ReportStatus
from app.models.types import enum_col, fk_col


class Report(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "reports"

    kind: Mapped[ReportKind] = enum_col(ReportKind, default=ReportKind.COMPLIANCE)
    company_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    project_id: Mapped[UUID | None] = fk_col("projects.id", ondelete="SET NULL", nullable=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ReportStatus] = enum_col(ReportStatus, default=ReportStatus.QUEUED)
    generated_by: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    total_hours: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    total_volunteers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_expense: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    schedule_vii_breakdown: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    detail: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    file_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_final: Mapped[bool] = mapped_column(default=False, nullable=False)

    __table_args__ = (Index("ix_reports_company_status", "company_user_id", "status"),)
