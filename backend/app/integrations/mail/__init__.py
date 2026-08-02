import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings
from app.integrations.mail.base import MailTransport

logger = logging.getLogger("kards.mail")


class ConsoleMailTransport(MailTransport):
    def send(self, to_email: str, subject: str, body_text: str) -> None:
        logger.info("[mail] To=%s Subject=%s\n%s", to_email, subject, body_text)


class SmtpMailTransport(MailTransport):
    def send(self, to_email: str, subject: str, body_text: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from
        msg["To"] = to_email
        msg.set_content(body_text)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)


def get_mail_transport() -> MailTransport:
    if settings.smtp_host:
        return SmtpMailTransport()
    return ConsoleMailTransport()
