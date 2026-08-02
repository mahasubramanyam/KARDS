from app.models.user import User, VolunteerProfile
from app.schemas.auth import (
    ProfileOut,
    UpdateCompanyProfile,
    UpdateNgoProfile,
    UpdateVolunteerProfile,
    UserOut,
    VolunteerProfileOut,
    NgoProfileOut,
    CompanyProfileOut,
)
from app.services.container import Services


class ProfileService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def get(self, user: User) -> ProfileOut:
        volunteer = self.s.volunteers.by_user(user.id)
        ngo = self.s.ngos.by_user(user.id)
        company = self.s.companies.by_user(user.id)
        return ProfileOut(
            user=UserOut.model_validate(user),
            volunteer=VolunteerProfileOut.model_validate(volunteer) if volunteer else None,
            ngo=NgoProfileOut.model_validate(ngo) if ngo else None,
            company=CompanyProfileOut.model_validate(company) if company else None,
        )

    def update_volunteer(self, user: User, payload: UpdateVolunteerProfile) -> None:
        profile = self.s.volunteers.by_user(user.id) or self.s.volunteers.add(
            VolunteerProfile(user_id=user.id, skills=[])
        )
        for field in ("location", "bio", "skills", "availability"):
            value = getattr(payload, field)
            if value is not None:
                setattr(profile, field, value)
        if payload.phone is not None:
            user.phone = payload.phone

    def update_ngo(self, user: User, payload: UpdateNgoProfile) -> None:
        profile = self.s.ngos.by_user(user.id)
        if not profile:
            return
        for field in ("org_name", "reg_number", "address", "city", "state", "pincode", "website", "description", "founded_year"):
            value = getattr(payload, field)
            if value is not None:
                setattr(profile, field, value)
        if payload.phone is not None:
            user.phone = payload.phone

    def update_company(self, user: User, payload: UpdateCompanyProfile) -> None:
        profile = self.s.companies.by_user(user.id)
        if not profile:
            return
        for field in ("company_name", "cin", "industry", "headquarters", "city", "state", "website", "description"):
            value = getattr(payload, field)
            if value is not None:
                setattr(profile, field, value)
        if payload.phone is not None:
            user.phone = payload.phone

    def set_locale(self, user: User, locale: str) -> None:
        user.locale = locale
