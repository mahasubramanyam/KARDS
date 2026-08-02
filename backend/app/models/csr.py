from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Integer, Numeric, String, Text, Uuid, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    OpportunityStatus,
    PartnershipStatus,
    ProjectStatus,
    ScheduleVII,
)
from app.models.types import enum_col, fk_col


class CsrBudget(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "csr_budgets"

    company_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    fiscal_year: Mapped[str] = mapped_column(String(9), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    __table_args__ = (UniqueConstraint("company_user_id", "fiscal_year", name="uq_budget_company_year"),)


class CsrBudgetAllocation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "csr_budget_allocations"

    budget_id: Mapped[UUID] = fk_col("csr_budgets.id", ondelete="CASCADE")
    category: Mapped[ScheduleVII] = enum_col(ScheduleVII)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)

    __table_args__ = (UniqueConstraint("budget_id", "category", name="uq_allocation_budget_category"),)


class Project(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "projects"

    company_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ScheduleVII] = enum_col(ScheduleVII)
    status: Mapped[ProjectStatus] = enum_col(ProjectStatus, default=ProjectStatus.DRAFT)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0, nullable=False)
    target_hours: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (Index("ix_projects_company", "company_user_id", "status"),)


class ProjectPartnership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "project_partnerships"

    project_id: Mapped[UUID] = fk_col("projects.id", ondelete="CASCADE")
    ngo_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    invited_by: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    status: Mapped[PartnershipStatus] = enum_col(PartnershipStatus, default=PartnershipStatus.INVITED)
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("project_id", "ngo_user_id", name="uq_partnership_project_ngo"),
        Index("ix_partnerships_ngo_status", "ngo_user_id", "status"),
    )


class Opportunity(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "opportunities"

    ngo_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    project_id: Mapped[UUID | None] = fk_col("projects.id", ondelete="SET NULL", nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[ScheduleVII] = enum_col(ScheduleVII)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_remote: Mapped[bool] = mapped_column(default=False, nullable=False)
    status: Mapped[OpportunityStatus] = enum_col(OpportunityStatus, default=OpportunityStatus.DRAFT)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    slots_total: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    slots_filled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hours_estimate: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        Index("ix_opportunities_ngo_status", "ngo_user_id", "status"),
        Index("ix_opportunities_project", "project_id"),
    )
