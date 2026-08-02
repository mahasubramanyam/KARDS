from fastapi import APIRouter

from app.api.deps import CURRENT_USER, SERVICES
from app.models.user import User
from app.schemas.auth import (
    ProfileOut,
    UpdateCompanyProfile,
    UpdateLocaleRequest,
    UpdateNgoProfile,
    UpdateVolunteerProfile,
)
from app.services.container import Services
from app.services.profile import ProfileService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=ProfileOut)
def get_me(user: CURRENT_USER, services: SERVICES) -> ProfileOut:
    return ProfileService(services).get(user)


@router.patch("/me/volunteer", response_model=ProfileOut)
def update_volunteer(user: CURRENT_USER, services: SERVICES, payload: UpdateVolunteerProfile) -> ProfileOut:
    ProfileService(services).update_volunteer(user, payload)
    return ProfileService(services).get(user)


@router.patch("/me/ngo", response_model=ProfileOut)
def update_ngo(user: CURRENT_USER, services: SERVICES, payload: UpdateNgoProfile) -> ProfileOut:
    ProfileService(services).update_ngo(user, payload)
    return ProfileService(services).get(user)


@router.patch("/me/company", response_model=ProfileOut)
def update_company(user: CURRENT_USER, services: SERVICES, payload: UpdateCompanyProfile) -> ProfileOut:
    ProfileService(services).update_company(user, payload)
    return ProfileService(services).get(user)


@router.patch("/me/locale", response_model=ProfileOut)
def update_locale(user: CURRENT_USER, services: SERVICES, payload: UpdateLocaleRequest) -> ProfileOut:
    ProfileService(services).set_locale(user, payload.locale.value)
    return ProfileService(services).get(user)
