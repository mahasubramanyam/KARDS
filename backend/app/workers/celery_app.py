from celery import Celery

from app.core.config import settings

celery = Celery(
    "kards",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=[
        "app.workers.reports",
        "app.workers.mail",
        "app.workers.billing",
    ],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "invoice-overdue-sweep": {
            "task": "app.workers.billing.sweep_overdue_invoices",
            "schedule": 3600.0,
        },
        "subscription-expiry-sweep": {
            "task": "app.workers.billing.sweep_expired_subscriptions",
            "schedule": 21600.0,
        },
    },
)
