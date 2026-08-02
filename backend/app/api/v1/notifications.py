from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import CURRENT_USER, SERVICES
from app.schemas.api import NotificationOut
from app.services.container import Services

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    user: CURRENT_USER, services: SERVICES, unread_only: bool = False, limit: int = 30
) -> list[NotificationOut]:
    return [NotificationOut.model_validate(n) for n in services.notifications.list_for_user(user.id, unread_only, limit)]


@router.get("/unread-count", response_model=dict)
def unread_count(user: CURRENT_USER, services: SERVICES) -> dict:
    return {"count": services.notifications.unread_count(user.id)}


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: UUID, user: CURRENT_USER, services: SERVICES) -> NotificationOut:
    from app.core.exceptions import NotFoundError
    from app.db.base import utcnow

    notification = services.notifications.get(notification_id)
    if not notification or notification.user_id != user.id:
        raise NotFoundError("Notification not found")
    if not notification.read_at:
        notification.read_at = utcnow()
    return NotificationOut.model_validate(notification)


@router.post("/read-all", response_model=dict)
def mark_all_read(user: CURRENT_USER, services: SERVICES) -> dict:
    from app.db.base import utcnow

    items = services.notifications.list_for_user(user.id, unread_only=True, limit=1000)
    for n in items:
        n.read_at = utcnow()
    return {"updated": len(items)}
