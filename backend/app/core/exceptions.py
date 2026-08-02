from fastapi import HTTPException, status


class AppError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, detail: dict | None = None) -> None:
        super().__init__(status_code=status_code, detail={"code": code, "message": message, "detail": detail or {}})


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required", code: str = "unauthorized") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, code, message)


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to perform this action", code: str = "forbidden") -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, code, message)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", code: str = "not_found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, code, message)


class ConflictError(AppError):
    def __init__(self, message: str, code: str = "conflict") -> None:
        super().__init__(status.HTTP_409_CONFLICT, code, message)


class ValidationFailedError(AppError):
    def __init__(self, message: str, code: str = "validation_error") -> None:
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, code, message)


class RateLimitedError(AppError):
    def __init__(self, message: str = "Too many requests. Please try again later.", code: str = "rate_limited") -> None:
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, code, message)


class PaymentRequiredError(AppError):
    def __init__(self, message: str, code: str = "payment_required") -> None:
        super().__init__(status.HTTP_402_PAYMENT_REQUIRED, code, message)
