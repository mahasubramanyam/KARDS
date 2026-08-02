from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import DocSubjectType, DocType, ScheduleVII
from app.schemas.common import OrmModel


class DocumentOut(OrmModel):
    id: UUID
    subject_type: DocSubjectType
    subject_id: UUID
    storage_key: str
    file_name: str
    mime_type: str
    size_bytes: int
    sha256: str
    uploaded_by: UUID | None = None
    doc_type: DocType | None = None
    validation_status: str | None = None
    validated_at: datetime | None = None
    validated_by: UUID | None = None
    rejection_reason: str | None = None
    created_at: datetime


class DocumentUploadRequest(BaseModel):
    file_name: str
    mime_type: str
    size_bytes: int = Field(gt=0)
    sha256: str = Field(min_length=64, max_length=64)
    doc_type: DocType | None = None


class UploadTicket(BaseModel):
    ticket_id: str
    storage_key: str
    method: str = "put"
    upload_url: str
    headers: dict = Field(default_factory=dict)


class VerificationRequestOut(OrmModel):
    id: UUID
    ngo_user_id: UUID
    status: str
    submitted_at: datetime
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    decision_reason: str | None = None
    created_at: datetime


class VerificationSubmitRequest(BaseModel):
    document_ids: list[UUID] = Field(min_length=1)


class CsrScoreOut(OrmModel):
    id: UUID
    ngo_user_id: UUID
    documents_weight: float
    operations_weight: float
    past_performance_weight: float
    governance_weight: float
    total: float
    computed_by: UUID | None = None
    created_at: datetime


class CsrScoreBreakdown(BaseModel):
    documents_weight: float
    operations_weight: float
    past_performance_weight: float
    governance_weight: float
    total: float


class BudgetCreate(BaseModel):
    fiscal_year: str = Field(pattern=r"^\d{4}-\d{2}$")
    total_amount: float = Field(gt=0)
    allocations: dict[ScheduleVII, float] = Field(default_factory=dict)


class BudgetOut(OrmModel):
    id: UUID
    company_user_id: UUID
    fiscal_year: str
    total_amount: float
    created_at: datetime
    updated_at: datetime


class AllocationOut(OrmModel):
    id: UUID
    budget_id: UUID
    category: ScheduleVII
    amount: float


class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    category: ScheduleVII
    start_date: date | None = None
    end_date: date | None = None
    budget_amount: float = Field(default=0, ge=0)
    target_hours: int = Field(default=0, ge=0)


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    category: ScheduleVII | None = None
    start_date: date | None = None
    end_date: date | None = None
    budget_amount: float | None = Field(default=None, ge=0)
    target_hours: int | None = Field(default=None, ge=0)


class ProjectOut(OrmModel):
    id: UUID
    company_user_id: UUID
    title: str
    description: str | None = None
    category: ScheduleVII
    status: str
    start_date: date | None = None
    end_date: date | None = None
    budget_amount: float
    target_hours: int
    created_at: datetime
    updated_at: datetime


class PartnershipInvite(BaseModel):
    ngo_user_id: UUID
    message: str | None = None


class PartnershipRespond(BaseModel):
    accept: bool
    message: str | None = None


class PartnershipOut(OrmModel):
    id: UUID
    project_id: UUID
    ngo_user_id: UUID
    invited_by: UUID
    status: str
    responded_at: datetime | None = None
    message: str | None = None
    created_at: datetime


class OpportunityCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    category: ScheduleVII
    location: str | None = Field(default=None, max_length=255)
    is_remote: bool = False
    start_date: date | None = None
    end_date: date | None = None
    slots_total: int = Field(default=1, ge=1)
    hours_estimate: int = Field(default=0, ge=0)
    project_id: UUID | None = None


class OpportunityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    category: ScheduleVII | None = None
    location: str | None = Field(default=None, max_length=255)
    is_remote: bool | None = None
    start_date: date | None = None
    end_date: date | None = None
    slots_total: int | None = Field(default=None, ge=1)
    hours_estimate: int | None = Field(default=None, ge=0)
    project_id: UUID | None = None


class OpportunityOut(OrmModel):
    id: UUID
    ngo_user_id: UUID
    project_id: UUID | None = None
    title: str
    description: str | None = None
    category: ScheduleVII
    location: str | None = None
    is_remote: bool
    status: str
    start_date: date | None = None
    end_date: date | None = None
    slots_total: int
    slots_filled: int
    hours_estimate: int
    created_at: datetime
    updated_at: datetime
