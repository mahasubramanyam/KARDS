from datetime import timedelta
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.exceptions import ConflictError, UnauthorizedError, ValidationFailedError
from app.db.base import utcnow
from app.models.enums import TokenPurpose
from app.models.user import CompanyProfile, NgoProfile, Token, User, VolunteerProfile
from app.schemas.auth import RegisterRequest, TokenPair
from app.services.audit import AuditService, RequestContext
from app.services.container import Services
from app.services.mail import MailService


class AuthService:
    def __init__(self, services: Services) -> None:
        self.s = services

    def register(self, payload: RegisterRequest) -> User:
        email = payload.email.lower()
        if self.s.users.by_email(email):
            raise ConflictError("An account with this email already exists", code="email_taken")

        user = self.s.users.add(
            User(
                email=email,
                password_hash=security.hash_password(payload.password),
                full_name=payload.full_name.strip(),
                role=payload.role,
                locale=payload.locale,
                phone=payload.phone,
            )
        )

        if payload.role == "volunteer":
            self.s.volunteers.add(
                VolunteerProfile(user_id=user.id, skills=payload.skills, location=payload.location)
            )
        elif payload.role == "ngo":
            if not payload.org_name:
                raise ValidationFailedError("org_name is required for NGO accounts", code="missing_org_name")
            self.s.ngos.add(
                NgoProfile(
                    user_id=user.id,
                    org_name=payload.org_name.strip(),
                    reg_number=payload.reg_number,
                    city=payload.city,
                    state=payload.state,
                    address=payload.address,
                )
            )
        elif payload.role == "company":
            if not payload.company_name:
                raise ValidationFailedError("company_name is required for company accounts", code="missing_company_name")
            self.s.companies.add(
                CompanyProfile(
                    user_id=user.id,
                    company_name=payload.company_name.strip(),
                    cin=payload.cin,
                    industry=payload.industry,
                )
            )

        self._issue_email_verification(user)
        return user

    def _issue_email_verification(self, user: User) -> str:
        raw = security.random_token()
        token = Token(
            user_id=user.id,
            purpose=TokenPurpose.EMAIL_VERIFY,
            token_hash=security.sha256_hex(raw),
            expires_at=utcnow() + timedelta(hours=24),
        )
        self.s.tokens.add(token)
        link = f"{settings.frontend_base_url}/verify-email?token={raw}"
        MailService(self.s).send(
            user.email,
            "Verify your Kards account",
            f"Hello {user.full_name},\n\nVerify your email to activate your Kards account:\n{link}\n\nThis link expires in 24 hours.",
        )
        return raw

    def login(self, email: str, password: str, context: RequestContext | None = None) -> TokenPair:
        user = self.s.users.by_email(email.lower())
        if not user or not security.verify_password(password, user.password_hash or ""):
            raise UnauthorizedError("Invalid email or password", code="invalid_credentials")
        if not user.email_verified_at:
            raise UnauthorizedError("Please verify your email before logging in", code="email_not_verified")
        if not user.is_active:
            raise UnauthorizedError("This account has been deactivated", code="account_disabled")
        return self._issue_tokens(user, context)

    def _issue_tokens(self, user: User, context: RequestContext | None = None) -> TokenPair:
        refresh = Token(
            user_id=user.id,
            purpose=TokenPurpose.REFRESH,
            token_hash=security.sha256_hex(raw := security.random_token()),
            family=uuid4(),
            expires_at=utcnow() + timedelta(days=settings.refresh_token_days),
        )
        self.s.tokens.add(refresh)
        audit = AuditService(self.s)
        audit.log(
            user.id, user.email, "auth.login", subject_type="user", subject_id=user.id, context=context
        )
        return TokenPair(
            access_token=security.create_access_token(user.id, user.role),
            refresh_token=security.create_refresh_token(user.id, user.role, refresh.id, refresh.family),
            expires_in=settings.access_token_minutes * 60,
        )

    def refresh(self, refresh_token: str, context: RequestContext | None = None) -> TokenPair:
        try:
            claims = security.decode_refresh_token(refresh_token)
        except Exception:
            raise UnauthorizedError("Invalid or expired refresh token", code="invalid_refresh_token")

        if claims.get("typ") != "refresh":
            raise UnauthorizedError("Invalid token type", code="invalid_refresh_token")

        jti = UUID(claims["jti"])
        family = UUID(claims["fam"])
        user_id = UUID(claims["sub"])
        stored = self.s.tokens.get(jti)
        now = utcnow()

        if stored is None or stored.revoked_at:
            self.s.tokens.revoke_family(family)
            raise UnauthorizedError("Refresh token reuse detected", code="token_reuse_detected")

        if stored.consumed_at or stored.expires_at < now:
            self.s.tokens.revoke_family(family)
            raise UnauthorizedError("Refresh token expired or already used", code="refresh_token_expired")

        user = self.s.users.by_id_active(user_id)
        if not user:
            raise UnauthorizedError("User not found or inactive", code="invalid_user")

        stored.consumed_at = now
        new_token = Token(
            user_id=user.id,
            purpose=TokenPurpose.REFRESH,
            token_hash=security.sha256_hex(raw := security.random_token()),
            family=family,
            expires_at=now + timedelta(days=settings.refresh_token_days),
        )
        self.s.tokens.add(new_token)
        stored.replaced_by = new_token.id

        return TokenPair(
            access_token=security.create_access_token(user.id, user.role),
            refresh_token=security.create_refresh_token(user.id, user.role, new_token.id, family),
            expires_in=settings.access_token_minutes * 60,
        )

    def logout(self, refresh_token: str) -> None:
        try:
            claims = security.decode_refresh_token(refresh_token)
            stored = self.s.tokens.get(UUID(claims["jti"]))
            if stored:
                stored.revoked_at = utcnow()
        except Exception:
            pass

    def verify_email(self, raw_token: str) -> None:
        record = self.s.tokens.by_hash(security.sha256_hex(raw_token), TokenPurpose.EMAIL_VERIFY.value)
        if not record or record.consumed_at or record.expires_at < utcnow():
            raise UnauthorizedError("Verification token is invalid or expired", code="invalid_verification_token")
        user = self.s.users.by_id_active(record.user_id)
        if not user:
            raise UnauthorizedError("User not found", code="invalid_user")
        record.consumed_at = utcnow()
        user.email_verified_at = utcnow()

    def resend_verification(self, email: str) -> None:
        user = self.s.users.by_email(email.lower())
        if not user:
            return
        if user.email_verified_at:
            return
        self._issue_email_verification(user)

    def forgot_password(self, email: str) -> None:
        user = self.s.users.by_email(email.lower())
        if not user:
            return
        raw = security.random_token()
        self.s.tokens.add(
            Token(
                user_id=user.id,
                purpose=TokenPurpose.PASSWORD_RESET,
                token_hash=security.sha256_hex(raw),
                expires_at=utcnow() + timedelta(hours=1),
            )
        )
        link = f"{settings.frontend_base_url}/reset-password?token={raw}"
        MailService(self.s).send(
            user.email,
            "Reset your Kards password",
            f"Hello {user.full_name},\n\nReset your password here:\n{link}\n\nThis link expires in 1 hour. If you didn't request this, ignore it.",
        )

    def reset_password(self, raw_token: str, new_password: str, context: RequestContext | None = None) -> None:
        record = self.s.tokens.by_hash(security.sha256_hex(raw_token), TokenPurpose.PASSWORD_RESET.value)
        if not record or record.consumed_at or record.expires_at < utcnow():
            raise UnauthorizedError("Reset token is invalid or expired", code="invalid_reset_token")
        user = self.s.users.by_id_active(record.user_id)
        if not user:
            raise UnauthorizedError("User not found", code="invalid_user")
        record.consumed_at = utcnow()
        user.password_hash = security.hash_password(new_password)
        self.s.tokens.revoke_refresh_for_user(user.id)
        AuditService(self.s).log(
            user.id, user.email, "auth.password_reset", subject_type="user", subject_id=user.id, context=context
        )
