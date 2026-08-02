from fastapi import APIRouter, Request

from app.api.deps import CURRENT_USER, SERVICES
from app.schemas.api import InvoiceOut, PlanOut, SubscribeRequest, SubscriptionOut
from app.services.billing import BillingService
from app.services.container import Services

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=list[PlanOut])
def list_plans(services: SERVICES) -> list[PlanOut]:
    return [PlanOut.model_validate(p) for p in BillingService(services).list_plans()]


@router.post("/subscribe", response_model=SubscriptionOut, status_code=201)
def subscribe(user: CURRENT_USER, services: SERVICES, payload: SubscribeRequest) -> SubscriptionOut:
    return SubscriptionOut.model_validate(BillingService(services).subscribe(user, payload.plan_id))


@router.get("/subscription", response_model=SubscriptionOut | None)
def my_subscription(user: CURRENT_USER, services: SERVICES) -> SubscriptionOut | None:
    subscription = BillingService(services).my_subscription(user)
    return SubscriptionOut.model_validate(subscription) if subscription else None


@router.get("/invoices", response_model=list[InvoiceOut])
def my_invoices(user: CURRENT_USER, services: SERVICES) -> list[InvoiceOut]:
    return [InvoiceOut.model_validate(i) for i in BillingService(services).list_invoices(user)]


@router.post("/webhook/{provider}", response_model=dict)
async def payment_webhook(provider: str, request: Request, services: SERVICES) -> dict:
    body = await request.body()
    event = BillingService(services).process_webhook(provider, body)
    return {"event_id": str(event.event_id), "processed": event.processed_at is not None}
