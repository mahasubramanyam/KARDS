from enum import StrEnum


class Role(StrEnum):
    VOLUNTEER = "volunteer"
    NGO = "ngo"
    COMPANY = "company"
    ADMIN = "admin"


class Locale(StrEnum):
    EN = "en"
    HI = "hi"
    TA = "ta"


class TokenPurpose(StrEnum):
    REFRESH = "refresh"
    EMAIL_VERIFY = "email_verify"
    PASSWORD_RESET = "password_reset"


class VerificationStatus(StrEnum):
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class DocType(StrEnum):
    FORM_12A = "12a"
    FORM_80G = "80g"
    FCRA = "fcra"
    PAN = "pan"
    NITI_AAYOG = "niti_aayog"
    OTHER = "other"


class DocValidationStatus(StrEnum):
    PENDING = "pending"
    VALID = "valid"
    INVALID = "invalid"


class DocSubjectType(StrEnum):
    NGO_VERIFICATION = "ngo_verification"
    PROJECT_EVIDENCE = "project_evidence"
    EXPENSE_RECEIPT = "expense_receipt"
    ATTENDANCE_SHEET = "attendance_sheet"
    REPORT_ATTACHMENT = "report_attachment"
    MESSAGE_ATTACHMENT = "message_attachment"


class ScheduleVII(StrEnum):
    EDUCATION = "education"
    HEALTH = "health"
    ENVIRONMENT = "environment"
    LIVELIHOOD = "livelihood"
    DISASTER_RELIEF = "disaster_relief"
    HERITAGE = "heritage"
    GENDER = "gender"
    HUNGER = "hunger"
    SPORTS = "sports"
    OTHER = "other"


class ProjectStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PartnershipStatus(StrEnum):
    INVITED = "invited"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class OpportunityStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class WorkLogStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class CertificateStatus(StrEnum):
    ISSUED = "issued"
    REVOKED = "revoked"


class CertificateTemplate(StrEnum):
    STANDARD = "standard"
    PREMIUM = "premium"


class ReportStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class ReportKind(StrEnum):
    COMPLIANCE = "compliance"
    PROJECT = "project"


class PlanTier(StrEnum):
    STARTER = "starter"
    GROWTH = "growth"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(StrEnum):
    TRIAL = "trial"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class InvoiceStatus(StrEnum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"


class DisputeSubjectType(StrEnum):
    CERTIFICATE = "certificate"
    WORK_LOG = "work_log"
    OPPORTUNITY = "opportunity"


class DisputeStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class NotificationType(StrEnum):
    APPLICATION = "application"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    HOURS = "hours"
    CERTIFICATE = "certificate"
    VERIFICATION = "verification"
    MESSAGE = "message"
    PARTNERSHIP = "partnership"
    SYSTEM = "system"


class AuditSeverity(StrEnum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
