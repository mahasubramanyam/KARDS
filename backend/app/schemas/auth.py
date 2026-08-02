from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import Locale, Role
from app.schemas.common import OrmModel


class EmailField:
    pass


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=160)
    role: Role
    locale: Locale = Locale.EN
    phone: str | None = Field(default=None, max_length=20)

    # volunteer
    skills: list[str] = Field(default_factory=list)
    location: str | None = None

    # ngo
    org_name: str | None = None
    reg_number: str | None = None
    city: str | None = None
    state: str | None = None
    address: str | None = None

    # company
    company_name: str | None = None
    cin: str | None = None
    industry: str | None = None

    @field_validator("password")
    @classmethod
    def password_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Password must not be blank")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class VerifyEmailRequest(BaseModel):
    token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class UserOut(OrmModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: Role
    locale: Locale
    phone: str | None = None
    email_verified_at: datetime | None = None
    created_at: datetime


class VolunteerProfileOut(OrmModel):
    user_id: UUID
    location: str | None = None
    bio: str | None = None
    skills: list[str]
    availability: str | None = None


class NgoProfileOut(OrmModel):
    user_id: UUID
    org_name: str
    reg_number: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    website: str | None = None
    description: str | None = None
    founded_year: int | None = None
    status: str
    verified_at: datetime | None = None


class CompanyProfileOut(OrmModel):
    user_id: UUID
    company_name: str
    cin: str | None = None
    industry: str | None = None
    headquarters: str | None = None
    city: str | None = None
    state: str | None = None
    website: str | None = None
    description: str | None = None


class ProfileOut(BaseModel):
    user: UserOut
    volunteer: VolunteerProfileOut | None = None
    ngo: NgoProfileOut | None = None
    company: CompanyProfileOut | None = None


class UpdateVolunteerProfile(BaseModel):
    location: str | None = Field(default=None, max_length=255)
    bio: str | None = None
    skills: list[str] = Field(default_factory=list)
    availability: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=20)


class UpdateNgoProfile(BaseModel):
    org_name: str | None = Field(default=None, max_length=200)
    reg_number: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, max_length=300)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    pincode: str | None = Field(default=None, max_length=12)
    website: str | None = Field(default=None, max_length=200)
    description: str | None = None
    founded_year: int | None = Field(default=None, ge=1950, le=2100)
    phone: str | None = Field(default=None, max_length=20)


class UpdateCompanyProfile(BaseModel):
    company_name: str | None = Field(default=None, max_length=200)
    cin: str | None = Field(default=None, max_length=30)
    industry: str | None = Field(default=None, max_length=120)
    headquarters: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    website: str | None = Field(default=None, max_length=200)
    description: str | None = None
    phone: str | None = Field(default=None, max_length=20)


class UpdateLocaleRequest(BaseModel):
    locale: Locale
