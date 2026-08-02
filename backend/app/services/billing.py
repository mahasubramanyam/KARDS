from datetime import date, timedelta
from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError, ValidationFailedError
from app.core.rbac import Permission, require
from app.db.base import utcnow
from app.integrations.payments import get_payment_provider
from app.models.enums import InvoiceStatus, Role, SubscriptionStatus
from app.models.finance import Invoice, PaymentEvent, Plan, Subscription
from app.models.user import User
from app.services.audit import AuditService
from app.services.container import Services


class BillingService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def list_plans(self) -> list[Plan]:
        return self.s.plans.list_all()

    def my_subscription(self, company: User) -> Subscription | None:
        return self.s.subscriptions.active_for_company(company.id)

    def subscribe(self, company: User, plan_id: UUID) -> Subscription:
        require(Role.COMPANY, Permission.MANAGE_OWN_COMPANY)
        plan = self.s.plans.get(plan_id)
        if not plan:
            raise NotFoundError("Plan not found")
        existing = self.s.subscriptions.active_for_company(company.id)
        if existing:
            raise ConflictError("Company already has an active subscription", code="already_subscribed")

        subscription = self.s.subscriptions.add(
            Subscription(
                company_user_id=company.id,
                plan_id=plan.id,
                status=SubscriptionStatus.TRIAL,
                provider="manual",
                current_period_start=date.today(),
                current_period_end=date.today() + timedelta(days=30),
            )
        )
        AuditService(self.s).log(
            company.id, company.email, "billing.subscribed", subject_type="subscription", subject_id=subscription.id
        )
        return subscription

    def list_invoices(self, company: User) -> list[Invoice]:
        return self.s.invoices.list_for_company(company.id)

    def process_webhook(self, provider: str, body: bytes) -> PaymentEvent:
        payment = get_payment_provider()
        if not payment.verify_webhook_signature(body, ""):
            raise ValidationFailedError("Webhook signature verification failed", code="invalid_signature")
        import json

        payload = json.loads(body.decode("utf-8"))
        event_id = payload.get("event_id") or payload.get("id")
        if not event_id:
            raise ValidationFailedError("Webhook payload missing event id", code="missing_event_id")

        existing = self.s.payments.by_provider_event(provider, event_id)
        if existing:
            return existing

        event = self.s.payments.add(
            PaymentEvent(provider=provider, event_id=event_id, event_type=payload.get("type", "unknown"), payload=payload)
        )
        self.s.db.flush()
        self._apply_event(provider, event)
        return event

    def _apply_event(self, provider: str, event: PaymentEvent) -> None:
        payload = event.payload
        event_type = event.event_type

        if "invoice" in event_type and "paid" in event_type:
            invoice_id = (payload.get("data") or {}).get("id")
            invoice = self.s.invoices.by_provider_id(provider, str(invoice_id)) if invoice_id else None
            if invoice:
                invoice.status = InvoiceStatus.PAID
                invoice.paid_at = utcnow()
        event.processed_at = utcnow()
        self.s.db.flush()

    def meter_success_fee(self, company_user_id: UUID, period_start: date, period_end: date) -> Invoice | None:
        from sqlalchemy import func, select

        from app.models.csr import Project

        deployed = self.s.db.scalar(
            select(func.coalesce(func.sum(Project.budget_amount), 0)).where(
                Project.company_user_id == company_user_id,
                Project.status == "active",
            )
        )
        fee = round(float(deployed or 0) * 0.02, 2)
        if fee <= 0:
            return None

        today = date.today()
        invoice = self.s.invoices.add(
            Invoice(
                company_user_id=company_user_id,
                provider="manual",
                provider_invoice_id=f"meter-{company_user_id}-{period_start.isoformat()}",
                amount=fee,
                status=InvoiceStatus.PENDING,
                due_date=today + timedelta(days=14),
                items=[{"label": "Success fee (2%) on deployed CSR budget", "amount": fee}],
            )
        )
        return invoice

    def sweep_overdue(self) -> int:
        from sqlalchemy import select

        rows = self.s.db.scalars(
            select(Invoice).where(Invoice.status == "pending", Invoice.due_date < date.today())
        ).all()
        for invoice in rows:
            invoice.status = InvoiceStatus.OVERDUE
        return len(rows)

    def sweep_expired(self) -> int:
        from sqlalchemy import select

        rows = self.s.db.scalars(
            select(Subscription).where(
                Subscription.status == SubscriptionStatus.TRIAL,
                Subscription.current_period_end < date.today(),
            )
        ).all()
        for sub in rows:
            sub.status = SubscriptionStatus.EXPIRED
        return len(rows)
