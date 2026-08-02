from app.integrations.mail import get_mail_transport
from app.models.misc import MailEvent
from app.services.container import Services


class MailService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def send(self, to_email: str, subject: str, body_text: str) -> MailEvent:
        transport = get_mail_transport()
        try:
            transport.send(to_email, subject, body_text)
            status, provider = "sent", type(transport).__name__
            error = None
        except Exception as exc:
            status, provider, error = "failed", type(transport).__name__, str(exc)
        return self.s.mail_events.add(
            MailEvent(to_email=to_email, subject=subject, body_text=body_text, status=status, provider=provider, error=error)
        )
