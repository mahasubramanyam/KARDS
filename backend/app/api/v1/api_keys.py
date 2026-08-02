from uuid import UUID

from fastapi import APIRouter

from app.api.deps import CURRENT_USER, SERVICES
from app.schemas.api import ApiKeyCreate, ApiKeyCreated, ApiKeyOut
from app.services.container import Services
from app.services.partner import PartnerService

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


@router.post("", response_model=ApiKeyCreated, status_code=201)
def create_api_key(user: CURRENT_USER, services: SERVICES, payload: ApiKeyCreate) -> ApiKeyCreated:
    return PartnerService(services).create_key(user, payload)


@router.get("", response_model=list[ApiKeyOut])
def list_api_keys(user: CURRENT_USER, services: SERVICES) -> list[ApiKeyOut]:
    return [ApiKeyOut.model_validate(k) for k in PartnerService(services).list_keys(user)]


@router.post("/{key_id}/revoke", response_model=ApiKeyOut)
def revoke_api_key(key_id: UUID, user: CURRENT_USER, services: SERVICES) -> ApiKeyOut:
    key = PartnerService(services).revoke_key(user, key_id)
    return ApiKeyOut.model_validate(key)
