from datetime import datetime
from uuid import UUID

from app.core.exceptions import NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.models.enums import NotificationType, Role
from app.models.messaging import Message, Thread, ThreadParticipant
from app.models.user import User
from app.services.audit import AuditService
from app.services.container import Services
from app.services.notifications import NotificationService


class MessagingService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def _ensure_participant(self, thread: Thread, user: User) -> None:
        if not self.s.participants.by_thread_user(thread.id, user.id):
            raise NotFoundError("Thread not found")

    def create_thread(
        self, creator: User, subject: str, subject_id: UUID, title: str, participant_ids: list[UUID]
    ) -> Thread:
        require(Role(creator.role), Permission.MESSAGE)
        thread = self.s.threads.by_subject(subject, subject_id)
        if not thread:
            thread = self.s.threads.add(
                Thread(subject=subject, subject_id=subject_id, title=title, created_by=creator.id)
            )
        participant_ids = set([creator.id, *participant_ids])
        for uid in participant_ids:
            if not self.s.participants.by_thread_user(thread.id, uid):
                self.s.participants.add(ThreadParticipant(thread_id=thread.id, user_id=uid))
        return thread

    def list_threads(self, user: User) -> list[Thread]:
        return self.s.threads.list_for_participant(user.id)

    def get_thread(self, user: User, thread_id: UUID) -> Thread:
        thread = self.s.threads.get(thread_id)
        if not thread:
            raise NotFoundError("Thread not found")
        self._ensure_participant(thread, user)
        return thread

    def messages(self, user: User, thread_id: UUID, before_id: UUID | None = None, limit: int = 50) -> list[Message]:
        thread = self.get_thread(user, thread_id)
        self._mark_read(user, thread)
        return self.s.messages.list_for_thread(thread.id, before_id, limit)

    def _mark_read(self, user: User, thread: Thread) -> None:
        participant = self.s.participants.by_thread_user(thread.id, user.id)
        if participant:
            participant.last_read_at = utcnow()

    def send(self, user: User, thread_id: UUID, body: str) -> Message:
        require(Role(user.role), Permission.MESSAGE)
        thread = self.get_thread(user, thread_id)
        message = self.s.messages.add(Message(thread_id=thread.id, sender_id=user.id, body=body))
        thread.last_message_at = utcnow()

        for participant in self.s.participants.list_all_for_thread(thread.id):
            if participant.user_id != user.id:
                NotificationService(self.s).send(
                    participant.user_id,
                    NotificationType.MESSAGE,
                    f"New message in {thread.title}",
                    body[:140],
                    "/app/messages",
                )
        AuditService(self.s).log(
            user.id, user.email, "message.sent", subject_type="thread", subject_id=thread.id
        )
        return message

    def mark_read(self, user: User, thread_id: UUID) -> datetime:
        thread = self.get_thread(user, thread_id)
        self._mark_read(user, thread)
        return utcnow()
