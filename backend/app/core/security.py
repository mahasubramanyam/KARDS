import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return password_hash.verify(plain, hashed)
    except Exception:
        return False


def _encode(payload: dict[str, Any], secret: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {**payload, "iat": now, "exp": now + expires}
    return jwt.encode(payload, secret, algorithm=settings.jwt_algorithm)


def _decode(token: str, secret: str) -> dict[str, Any]:
    return jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "typ": "access"},
        settings.jwt_access_secret,
        timedelta(minutes=settings.access_token_minutes),
    )


def create_refresh_token(user_id: uuid.UUID, role: str, token_id: uuid.UUID, family: uuid.UUID) -> str:
    return _encode(
        {"sub": str(user_id), "role": role, "typ": "refresh", "jti": str(token_id), "fam": str(family)},
        settings.jwt_refresh_secret,
        timedelta(days=settings.refresh_token_days),
    )


def decode_access_token(token: str) -> dict[str, Any]:
    return _decode(token, settings.jwt_access_secret)


def decode_refresh_token(token: str) -> dict[str, Any]:
    return _decode(token, settings.jwt_refresh_secret)


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def random_token() -> str:
    return secrets.token_urlsafe(48)


def verification_code(prefix: str = "KRD") -> str:
    return f"{prefix}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(2).upper()}"


def certificate_content_hash(canonical: str) -> str:
    return sha256_hex(canonical)


def api_key_prefix() -> str:
    return f"krd_live_{secrets.token_hex(8)}"


def api_key_secret() -> str:
    return secrets.token_hex(24)
