from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Index, Integer, String, Text, Uuid
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin, utcnow
from app.models.enums import Locale, Role, TokenPurpose, VerificationStatus
from app.models.types import enum_col, fk_col


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    role: Mapped[Role] = enum_col(Role, default=Role.VOLUNTEER)
    locale: Mapped[Locale] = enum_col(Locale, default=Locale.EN)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Token(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tokens"

    user_id: Mapped[UUID] = fk_col("users.id")
    purpose: Mapped[TokenPurpose] = enum_col(TokenPurpose)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    family: Mapped[UUID | None] = mapped_column(Uuid, nullable=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by: Mapped[UUID | None] = mapped_column(Uuid, nullable=True)

    __table_args__ = (Index("ix_tokens_user_purpose", "user_id", "purpose"),)


class VolunteerProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "volunteer_profiles"

    user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String(60)), default=list, nullable=False)
    availability: Mapped[str | None] = mapped_column(String(120), nullable=True)


class NgoProfile(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "ngo_profiles"

    user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    reg_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(12), nullable=True)
    website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    founded_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[VerificationStatus] = enum_col(VerificationStatus, default=VerificationStatus.UNVERIFIED)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CompanyProfile(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "company_profiles"

    user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    cin: Mapped[str | None] = mapped_column(String(30), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(120), nullable=True)
    headquarters: Mapped[str | None] = mapped_column(String(200), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    website: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
