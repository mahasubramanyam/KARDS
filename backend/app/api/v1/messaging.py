from datetime import datetime
from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CURRENT_USER, SERVICES
from app.schemas.api import MessageCreate, MessageOut, ThreadCreate, ThreadOut, ThreadWithMessages
from app.services.container import Services
from app.services.messaging import MessagingService

router = APIRouter(prefix="/messaging", tags=["messaging"])


@router.post("/threads", response_model=ThreadOut, status_code=201)
def create_thread(user: CURRENT_USER, services: SERVICES, payload: ThreadCreate) -> ThreadOut:
    thread = MessagingService(services).create_thread(
        user, payload.subject, payload.subject_id, payload.title, payload.participant_ids
    )
    return ThreadOut.model_validate(thread)


@router.get("/threads", response_model=list[ThreadOut])
def list_threads(user: CURRENT_USER, services: SERVICES) -> list[ThreadOut]:
    return [ThreadOut.model_validate(t) for t in MessagingService(services).list_threads(user)]


@router.get("/threads/{thread_id}", response_model=ThreadWithMessages)
def get_thread(thread_id: UUID, user: CURRENT_USER, services: SERVICES) -> ThreadWithMessages:
    messaging = MessagingService(services)
    thread = messaging.get_thread(user, thread_id)
    messages = messaging.messages(user, thread_id)
    return ThreadWithMessages(
        **ThreadOut.model_validate(thread).model_dump(),
        messages=[MessageOut.model_validate(m) for m in messages],
    )


@router.post("/threads/{thread_id}/messages", response_model=MessageOut, status_code=201)
def send_message(thread_id: UUID, user: CURRENT_USER, services: SERVICES, payload: MessageCreate) -> MessageOut:
    message = MessagingService(services).send(user, thread_id, payload.body)
    return MessageOut.model_validate(message)


@router.post("/threads/{thread_id}/read", response_model=dict)
def mark_read(thread_id: UUID, user: CURRENT_USER, services: SERVICES) -> dict:
    read_at: datetime = MessagingService(services).mark_read(user, thread_id)
    return {"read_at": read_at.isoformat()}
