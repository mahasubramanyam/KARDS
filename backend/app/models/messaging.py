from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Index, String, Text, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.types import fk_col


class Thread(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "threads"

    subject: Mapped[str] = mapped_column(String(80), nullable=False)
    subject_id: Mapped[UUID] = mapped_column(Uuid, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    created_by: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("subject", "subject_id", name="uq_thread_subject"),
        Index("ix_threads_updated", "last_message_at"),
    )


class Message(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "messages"

    thread_id: Mapped[UUID] = fk_col("threads.id", ondelete="CASCADE")
    sender_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    body: Mapped[str] = mapped_column(Text, nullable=False)
    attachment_key: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (Index("ix_messages_thread", "thread_id", "created_at"),)


class ThreadParticipant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "thread_participants"

    thread_id: Mapped[UUID] = fk_col("threads.id", ondelete="CASCADE")
    user_id: Mapped[UUID] = fk_col("users.id", ondelete="CASCADE")
    last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (UniqueConstraint("thread_id", "user_id", name="uq_thread_participant"),)
