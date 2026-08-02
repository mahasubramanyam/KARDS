from fastapi import APIRouter

from app.api.v1 import (
    admin,
    api_keys,
    auth,
    billing,
    csr,
    disputes,
    messaging,
    notifications,
    partner,
    public,
    reports,
    uploads,
    users,
    verification,
    volunteering,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(verification.router)
api_router.include_router(csr.router)
api_router.include_router(volunteering.router)
api_router.include_router(reports.router)
api_router.include_router(billing.router)
api_router.include_router(messaging.router)
api_router.include_router(disputes.router)
api_router.include_router(admin.router)
api_router.include_router(api_keys.router)
api_router.include_router(partner.router)
api_router.include_router(notifications.router)
api_router.include_router(uploads.router)
api_router.include_router(public.router)
