from datetime import date, datetime
from uuid import UUID

from sqlalchemy import JSON, Date, DateTime, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import InvoiceStatus, PlanTier, SubscriptionStatus
from app.models.types import enum_col, fk_col


class Plan(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "plans"

    tier: Mapped[PlanTier] = enum_col(PlanTier, unique=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    price_monthly: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    price_annual: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    seats: Mapped[int] = mapped_column(default=1, nullable=False)
    features: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)


class Subscription(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "subscriptions"

    company_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    plan_id: Mapped[UUID] = fk_col("plans.id", ondelete="RESTRICT")
    status: Mapped[SubscriptionStatus] = enum_col(SubscriptionStatus, default=SubscriptionStatus.TRIAL)
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    provider_subscription_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    current_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    current_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_subscriptions_company", "company_user_id", "status"),)


class Invoice(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "invoices"

    company_user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    subscription_id: Mapped[UUID | None] = fk_col("subscriptions.id", ondelete="SET NULL", nullable=True)
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    provider_invoice_id: Mapped[str | None] = mapped_column(String(200), nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[InvoiceStatus] = enum_col(InvoiceStatus, default=InvoiceStatus.PENDING)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    items: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)

    __table_args__ = (
        UniqueConstraint("provider", "provider_invoice_id", name="uq_invoice_provider_id"),
        Index("ix_invoices_company_status", "company_user_id", "status"),
    )


class PaymentEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_events"

    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    event_id: Mapped[str] = mapped_column(String(200), nullable=False)
    event_type: Mapped[str] = mapped_column(String(120), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (UniqueConstraint("provider", "event_id", name="uq_payment_event"),)
