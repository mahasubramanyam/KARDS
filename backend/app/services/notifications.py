from uuid import UUID

from app.models.enums import NotificationType
from app.models.misc import Notification
from app.services.container import Services


class NotificationService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def send(
        self,
        user_id: UUID,
        type: NotificationType,
        title: str,
        body: str | None = None,
        link: str | None = None,
    ) -> Notification:
        return self.s.notifications.add(
            Notification(user_id=user_id, type=type, title=title, body=body, link=link)
        )
