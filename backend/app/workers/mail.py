from app.db.session import SessionLocal
from app.services.container import Services
from app.workers.celery_app import celery


@celery.task(name="app.workers.mail.send_mail", bind=True, max_retries=3)
def send_mail(self, to_email: str, subject: str, body_text: str) -> None:
    from app.services.mail import MailService

    with SessionLocal() as db:
        services = Services(db)
        MailService(services).send(to_email, subject, body_text)
