from sqlalchemy.orm import Session

from app.repositories.all import (
    ApiKeyRepository,
    AuditLogRepository,
    CertificateRepository,
    DisputeRepository,
    InvoiceRepository,
    MailEventRepository,
    MessageRepository,
    NotificationRepository,
    PaymentEventRepository,
    PlanRepository,
    SubscriptionRepository,
    ThreadParticipantRepository,
    ThreadRepository,
)
from app.repositories.csr import (
    AllocationRepository,
    CsrBudgetRepository,
    OpportunityRepository,
    PartnershipRepository,
    ProjectRepository,
)
from app.repositories.ngo import CsrScoreRepository, DocumentRepository, VerificationRequestRepository
from app.repositories.report import ReportQuery
from app.repositories.user import (
    CompanyProfileRepository,
    NgoProfileRepository,
    TokenRepository,
    UserRepository,
    VolunteerProfileRepository,
)
from app.repositories.volunteering import ApplicationRepository, WorkLogRepository


class Services:
    def __init__(self, db: Session) -> None:
        self.db = db

        self.users = UserRepository(db)
        self.tokens = TokenRepository(db)
        self.volunteers = VolunteerProfileRepository(db)
        self.ngos = NgoProfileRepository(db)
        self.companies = CompanyProfileRepository(db)

        self.documents = DocumentRepository(db)
        self.verifications = VerificationRequestRepository(db)
        self.scores = CsrScoreRepository(db)

        self.budgets = CsrBudgetRepository(db)
        self.allocations = AllocationRepository(db)
        self.projects = ProjectRepository(db)
        self.partnerships = PartnershipRepository(db)
        self.opportunities = OpportunityRepository(db)

        self.applications = ApplicationRepository(db)
        self.worklogs = WorkLogRepository(db)

        self.certificates = CertificateRepository(db)
        self.report_query = ReportQuery(db)

        self.plans = PlanRepository(db)
        self.subscriptions = SubscriptionRepository(db)
        self.invoices = InvoiceRepository(db)
        self.payments = PaymentEventRepository(db)

        self.threads = ThreadRepository(db)
        self.messages = MessageRepository(db)
        self.participants = ThreadParticipantRepository(db)

        self.disputes = DisputeRepository(db)
        self.api_keys = ApiKeyRepository(db)
        self.audits = AuditLogRepository(db)
        self.notifications = NotificationRepository(db)
        self.mail_events = MailEventRepository(db)
