from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Kards API"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    database_url: str = "postgresql+psycopg://kards:kards@localhost:5432/kards"
    redis_url: str = "redis://localhost:6379/0"

    jwt_access_secret: str = "dev-only-access-secret-change-me"
    jwt_refresh_secret: str = "dev-only-refresh-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 14
    refresh_token_max_age_days: int = 90

    storage_backend: str = "local"
    storage_local_dir: str = "storage"
    s3_bucket: str = ""
    s3_region: str = ""
    s3_endpoint_url: str | None = None

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Kards <no-reply@kards.in>"

    payment_provider: str = "manual"
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    report_max_rows: int = 50000
    upload_max_bytes: int = 15 * 1024 * 1024
    allowed_upload_types: list[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    frontend_base_url: str = "http://localhost:3000"


settings = Settings()
