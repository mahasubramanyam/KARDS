from datetime import date

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.user import User
from app.services.billing import BillingService
from app.services.container import Services
from app.workers.celery_app import celery


@celery.task(name="app.workers.billing.sweep_overdue_invoices")
def sweep_overdue_invoices() -> int:
    with SessionLocal() as db:
        services = Services(db)
        count = BillingService(services).sweep_overdue()
        db.commit()
        return count


@celery.task(name="app.workers.billing.sweep_expired_subscriptions")
def sweep_expired_subscriptions() -> int:
    with SessionLocal() as db:
        services = Services(db)
        count = BillingService(services).sweep_expired()
        db.commit()
        return count


@celery.task(name="app.workers.billing.meter_success_fees")
def meter_success_fees(period_start: str, period_end: str) -> int:
    from datetime import datetime

    start = datetime.fromisoformat(period_start).date()
    end = datetime.fromisoformat(period_end).date()
    with SessionLocal() as db:
        services = Services(db)
        billing = BillingService(services)
        companies = db.scalars(select(User).where(User.role == "company", User.is_active.is_(True))).all()
        created = 0
        for company in companies:
            if billing.meter_success_fee(company.id, start, end) is not None:
                created += 1
        db.commit()
        return created
