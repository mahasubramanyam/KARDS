import hashlib
import hmac
import json
from abc import ABC, abstractmethod

import httpx

from app.core.config import settings


class PaymentProvider(ABC):
    @abstractmethod
    def create_payment_link(self, amount_inr: int, description: str, reference: str) -> str: ...

    @abstractmethod
    def verify_webhook_signature(self, body: bytes, signature: str) -> bool: ...


class ManualPaymentProvider(PaymentProvider):
    """Accepts webhook events as-is (idempotently) — used until a gateway is configured."""

    def create_payment_link(self, amount_inr: int, description: str, reference: str) -> str:
        raise NotImplementedError("No payment gateway configured")

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        return True


class RazorpayProvider(PaymentProvider):
    def __init__(self) -> None:
        if not settings.razorpay_key_id or not settings.razorpay_key_secret:
            raise RuntimeError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required for razorpay provider")
        self._auth = (settings.razorpay_key_id, settings.razorpay_key_secret)
        self._base = "https://api.razorpay.com/v1"

    def create_payment_link(self, amount_inr: int, description: str, reference: str) -> str:
        resp = httpx.post(
            f"{self._base}/payment_links",
            auth=self._auth,
            json={"amount": amount_inr, "currency": "INR", "description": description, "reference_id": reference},
        )
        resp.raise_for_status()
        return resp.json()["short_url"]

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        expected = hmac.new(
            settings.razorpay_key_secret.encode(), body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


def get_payment_provider() -> PaymentProvider:
    if settings.payment_provider == "razorpay":
        return RazorpayProvider()
    return ManualPaymentProvider()


def to_paise(amount_inr: float) -> int:
    return int(round(amount_inr * 100))
