from datetime import date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.dispute import Dispute
from app.models.finance import Invoice, PaymentEvent, Plan, Subscription
from app.models.messaging import Message, Thread, ThreadParticipant
from app.models.misc import MailEvent, Notification
from app.models.ngo import Document, VerificationRequest
from app.models.partner import ApiKey
from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class PlanRepository(BaseRepository[Plan]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Plan)

    def list_all(self) -> list[Plan]:
        return list(self.db.scalars(select(Plan).order_by(Plan.price_monthly)).all())

    def by_tier(self, tier: str) -> Plan | None:
        return self.db.scalar(select(Plan).where(Plan.tier == tier))


class CertificateRepository(BaseRepository[Certificate]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Certificate)

    def by_code(self, code: str) -> Certificate | None:
        return self.db.scalar(select(Certificate).where(Certificate.code == code))

    def list_for_volunteer(self, volunteer_id, skip: int = 0, limit: int = 50) -> list[Certificate]:
        return list(
            self.db.scalars(
                select(Certificate)
                .where(Certificate.volunteer_id == volunteer_id)
                .order_by(Certificate.issued_at.desc())
                .offset(skip)
                .limit(limit)
            ).all()
        )


class SubscriptionRepository(BaseRepository[Subscription]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Subscription)

    def active_for_company(self, company_user_id) -> Subscription | None:
        return self.db.scalar(
            select(Subscription)
            .where(Subscription.company_user_id == company_user_id, Subscription.status.in_(["trial", "active", "past_due"]))
            .order_by(Subscription.created_at.desc())
            .limit(1)
        )


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Invoice)

    def list_for_company(self, company_user_id, skip: int = 0, limit: int = 50) -> list[Invoice]:
        return list(
            self.db.scalars(
                select(Invoice)
                .where(Invoice.company_user_id == company_user_id)
                .order_by(Invoice.created_at.desc())
                .offset(skip)
                .limit(limit)
            ).all()
        )

    def by_provider_id(self, provider: str, provider_invoice_id: str) -> Invoice | None:
        return self.db.scalar(
            select(Invoice).where(Invoice.provider == provider, Invoice.provider_invoice_id == provider_invoice_id)
        )


class PaymentEventRepository(BaseRepository[PaymentEvent]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, PaymentEvent)

    def by_provider_event(self, provider: str, event_id: str) -> PaymentEvent | None:
        return self.db.scalar(
            select(PaymentEvent).where(PaymentEvent.provider == provider, PaymentEvent.event_id == event_id)
        )


class ThreadRepository(BaseRepository[Thread]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Thread)

    def by_subject(self, subject: str, subject_id: UUID) -> Thread | None:
        return self.db.scalar(select(Thread).where(Thread.subject == subject, Thread.subject_id == subject_id))

    def list_for_participant(self, user_id: UUID) -> list[Thread]:
        return list(
            self.db.scalars(
                select(Thread)
                .join(ThreadParticipant, ThreadParticipant.thread_id == Thread.id)
                .where(ThreadParticipant.user_id == user_id)
                .order_by(Thread.last_message_at.desc().nullslast())
            ).all()
        )


class MessageRepository(BaseRepository[Message]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Message)

    def list_for_thread(self, thread_id: UUID, before_id: UUID | None = None, limit: int = 50) -> list[Message]:
        q = select(Message).where(Message.thread_id == thread_id).order_by(Message.created_at.desc()).limit(limit)
        if before_id:
            q = q.where(Message.id < before_id)
        return list(self.db.scalars(q).all())[::-1]


class ThreadParticipantRepository(BaseRepository[ThreadParticipant]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ThreadParticipant)

    def by_thread_user(self, thread_id: UUID, user_id: UUID) -> ThreadParticipant | None:
        return self.db.scalar(
            select(ThreadParticipant).where(
                ThreadParticipant.thread_id == thread_id, ThreadParticipant.user_id == user_id
            )
        )

    def list_all_for_thread(self, thread_id: UUID) -> list[ThreadParticipant]:
        return list(
            self.db.scalars(
                select(ThreadParticipant).where(ThreadParticipant.thread_id == thread_id)
            ).all()
        )


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Notification)

    def list_for_user(self, user_id: UUID, unread_only: bool = False, limit: int = 30) -> list[Notification]:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.read_at.is_(None))
        return list(self.db.scalars(q.order_by(Notification.created_at.desc()).limit(limit)).all())

    def unread_count(self, user_id: UUID) -> int:
        return self.count(Notification.user_id == user_id, Notification.read_at.is_(None))


class DisputeRepository(BaseRepository[Dispute]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Dispute)

    def list_open(self, skip: int = 0, limit: int = 50) -> list[Dispute]:
        return list(
            self.db.scalars(
                select(Dispute).where(Dispute.status == "open").order_by(Dispute.created_at.desc()).offset(skip).limit(limit)
            ).all()
        )


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ApiKey)

    def by_key_hash(self, key_hash: str) -> ApiKey | None:
        return self.db.scalar(select(ApiKey).where(ApiKey.key_hash == key_hash))

    def list_for_company(self, company_user_id: UUID) -> list[ApiKey]:
        return list(
            self.db.scalars(
                select(ApiKey).where(ApiKey.company_user_id == company_user_id).order_by(ApiKey.created_at.desc())
            ).all()
        )


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, AuditLog)

    def list_filtered(self, severity: str | None = None, skip: int = 0, limit: int = 50) -> list[AuditLog]:
        q = select(AuditLog)
        if severity:
            q = q.where(AuditLog.severity == severity)
        return list(self.db.scalars(q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)).all())


class MailEventRepository(BaseRepository[MailEvent]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, MailEvent)
