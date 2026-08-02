from fastapi import APIRouter, Request

from app.api.deps import SERVICES, get_request_context
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenPair,
    UserOut,
    VerifyEmailRequest,
)
from app.services.auth import AuthService
from app.services.container import Services

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(payload: RegisterRequest, services: SERVICES) -> UserOut:
    user = AuthService(services).register(payload)
    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, services: SERVICES, request: Request) -> TokenPair:
    return AuthService(services).login(payload.email, payload.password, get_request_context(request))


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, services: SERVICES, request: Request) -> TokenPair:
    return AuthService(services).refresh(payload.refresh_token, get_request_context(request))


@router.post("/logout", response_model=MessageResponse)
def logout(payload: RefreshRequest, services: SERVICES) -> MessageResponse:
    AuthService(services).logout(payload.refresh_token)
    return MessageResponse(message="Logged out")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: VerifyEmailRequest, services: SERVICES) -> MessageResponse:
    AuthService(services).verify_email(payload.token)
    return MessageResponse(message="Email verified")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(payload: ForgotPasswordRequest, services: SERVICES) -> MessageResponse:
    AuthService(services).resend_verification(payload.email)
    return MessageResponse(message="If the account exists, a verification email has been sent")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, services: SERVICES) -> MessageResponse:
    AuthService(services).forgot_password(payload.email)
    return MessageResponse(message="If the account exists, a reset email has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, services: SERVICES, request: Request) -> MessageResponse:
    AuthService(services).reset_password(payload.token, payload.new_password, get_request_context(request))
    return MessageResponse(message="Password reset")
