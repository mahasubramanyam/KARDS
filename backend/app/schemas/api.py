from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import OrmModel


class ApplicationCreate(BaseModel):
    opportunity_id: UUID
    cover_note: str | None = None


class ApplicationOut(OrmModel):
    id: UUID
    opportunity_id: UUID
    volunteer_id: UUID
    status: str
    cover_note: str | None = None
    applied_at: datetime
    decided_at: datetime | None = None
    decided_by: UUID | None = None
    created_at: datetime


class ApplicationDecision(BaseModel):
    accept: bool


class WorkLogCreate(BaseModel):
    opportunity_id: UUID
    log_date: date
    hours: float = Field(gt=0, le=24)
    note: str | None = None


class WorkLogOut(OrmModel):
    id: UUID
    opportunity_id: UUID
    volunteer_id: UUID
    application_id: UUID | None = None
    log_date: date
    hours: float
    note: str | None = None
    status: str
    approved_by: UUID | None = None
    approved_at: datetime | None = None
    created_at: datetime


class CertificateOut(OrmModel):
    id: UUID
    code: str
    volunteer_id: UUID
    opportunity_id: UUID
    ngo_user_id: UUID
    title: str
    hours_total: float
    issued_at: datetime
    issued_by: UUID
    template: str
    status: str
    content_hash: str
    created_at: datetime


class CertificatePublic(BaseModel):
    valid: bool
    code: str
    volunteer_name: str | None = None
    opportunity_title: str | None = None
    hours_total: float | None = None
    issued_at: datetime | None = None
    status: str | None = None
    content_hash_verified: bool | None = None


class ReportRequest(BaseModel):
    kind: str = "compliance"
    project_id: UUID | None = None
    period_start: date
    period_end: date


class ReportOut(OrmModel):
    id: UUID
    kind: str
    company_user_id: UUID
    project_id: UUID | None = None
    period_start: date
    period_end: date
    status: str
    generated_by: UUID
    total_hours: float | None = None
    total_volunteers: int | None = None
    total_expense: float | None = None
    schedule_vii_breakdown: dict | None = None
    detail: dict | None = None
    file_name: str | None = None
    error_message: str | None = None
    finalized_at: datetime | None = None
    is_final: bool
    created_at: datetime


class ReportFinalize(BaseModel):
    project_id: UUID | None = None
    period_start: date
    period_end: date


class InvoiceOut(OrmModel):
    id: UUID
    company_user_id: UUID
    subscription_id: UUID | None = None
    provider: str
    provider_invoice_id: str | None = None
    amount: float
    status: str
    due_date: date
    paid_at: datetime | None = None
    items: list[dict] | None = None
    created_at: datetime


class SubscriptionOut(OrmModel):
    id: UUID
    company_user_id: UUID
    plan_id: UUID
    status: str
    provider: str
    provider_subscription_id: str | None = None
    current_period_start: date
    current_period_end: date
    created_at: datetime


class PlanOut(OrmModel):
    id: UUID
    tier: str
    name: str
    price_monthly: float
    price_annual: float
    seats: int
    features: list[str]


class SubscribeRequest(BaseModel):
    plan_id: UUID


class ThreadCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=80)
    subject_id: UUID
    title: str = Field(min_length=1, max_length=200)
    participant_ids: list[UUID] = Field(default_factory=list)


class ThreadOut(OrmModel):
    id: UUID
    subject: str
    subject_id: UUID
    title: str
    created_by: UUID
    last_message_at: datetime | None = None
    created_at: datetime


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=8000)


class MessageOut(OrmModel):
    id: UUID
    thread_id: UUID
    sender_id: UUID
    body: str
    attachment_key: str | None = None
    created_at: datetime


class ThreadWithMessages(ThreadOut):
    messages: list[MessageOut] = Field(default_factory=list)


class DisputeCreate(BaseModel):
    subject_type: str
    subject_id: UUID
    summary: str = Field(min_length=10, max_length=4000)


class DisputeOut(OrmModel):
    id: UUID
    subject_type: str
    subject_id: UUID
    filed_by: UUID
    against_user_id: UUID | None = None
    summary: str
    status: str
    decision: str | None = None
    resolved_by: UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime


class DisputeResolve(BaseModel):
    decision: str = Field(min_length=3, max_length=4000)


class NotificationOut(OrmModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    body: str | None = None
    link: str | None = None
    read_at: datetime | None = None
    created_at: datetime


class AuditOut(OrmModel):
    id: UUID
    actor_id: UUID | None = None
    actor_email: str | None = None
    action: str
    subject_type: str | None = None
    subject_id: UUID | None = None
    details: dict | None = None
    ip_address: str | None = None
    severity: str
    created_at: datetime


class AdminNgoDecision(BaseModel):
    approve: bool
    reason: str = Field(min_length=3, max_length=2000)


class ApiKeyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    scopes: list[str] = Field(default_factory=list)
    rate_limit_per_hour: int = Field(default=1000, ge=100, le=100000)


class ApiKeyOut(OrmModel):
    id: UUID
    company_user_id: UUID
    name: str
    key_prefix: str
    scopes: list[str]
    is_active: bool
    rate_limit_per_hour: int
    last_used_at: datetime | None = None
    revoked_at: datetime | None = None
    created_at: datetime


class ApiKeyCreated(ApiKeyOut):
    plain_key: str


class VerifyResponse(BaseModel):
    message: str
