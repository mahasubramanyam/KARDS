import logging
import uuid

import redis
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppError, RateLimitedError
from app.core.logging import configure_logging, get_logger
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.finance import Plan
from app.models.enums import PlanTier

configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_redis: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1)
            _redis.ping()
        except Exception:
            logger.warning("Redis unavailable — rate limiting disabled")
            _redis = None
    return _redis


@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client = get_redis()
    if client is not None:
        ip = request.client.host if request.client else "unknown"
        key = f"rl:{ip}:{int(__import__('time').time() // 60)}"
        try:
            count = client.incr(key)
            if count == 1:
                client.expire(key, 60)
            if count > 60:
                raise RateLimitedError()
        except RateLimitedError:
            return JSONResponse(status_code=429, content={"error": {"code": "rate_limited", "message": "Too many requests. Please try again later.", "detail": {}}})
        except Exception:
            pass
    response = await call_next(request)
    response.headers["X-Request-Id"] = str(uuid.uuid4())
    return response


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "validation_error",
                "message": "Request validation failed",
                "detail": {"errors": exc.errors()},
            }
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "internal_error", "message": "Internal server error", "detail": {}}},
    )


DEFAULT_PLANS = [
    (PlanTier.STARTER, "Starter", 0, 0, 1, ["Budget tracking", "1 active project", "Volunteer hour approvals"]),
    (PlanTier.GROWTH, "Growth", 499, 4990, 5, ["Unlimited projects", "CSR compliance reports", "Partnerships & messaging", "API access"]),
    (PlanTier.ENTERPRISE, "Enterprise", 1499, 14990, 25, ["Everything in Growth", "Success-fee billing", "White-label API keys", "Priority verification", "Dedicated support"]),
]


def seed_plans() -> None:
    with SessionLocal() as db:
        if db.scalar(select(Plan).limit(1)) is not None:
            return
        for tier, name, price_monthly, price_annual, seats, features in DEFAULT_PLANS:
            db.add(
                Plan(
                    tier=tier,
                    name=name,
                    price_monthly=price_monthly,
                    price_annual=price_annual,
                    seats=seats,
                    features=features,
                )
            )
        db.commit()
        logger.info("Seeded default subscription plans")


@app.on_event("startup")
def on_startup() -> None:
    from pathlib import Path

    Path(settings.storage_local_dir).mkdir(parents=True, exist_ok=True)
    seed_plans()
    logger.info("Kards API started (env=%s)", settings.app_env)


@app.get("/health")
def health() -> dict:
    db_ok = False
    redis_ok = False
    try:
        with SessionLocal() as db:
            db.execute(select(1))
        db_ok = True
    except Exception:
        pass
    client = get_redis()
    redis_ok = client is not None
    return {"status": "ok" if db_ok and redis_ok else "degraded", "db": db_ok, "redis": redis_ok, "env": settings.app_env}


from pathlib import Path

Path(settings.storage_local_dir).mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=settings.storage_local_dir), name="uploads")

app.include_router(api_router, prefix=settings.api_v1_prefix)
