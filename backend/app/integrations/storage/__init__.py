from app.core.config import settings
from app.integrations.storage.base import LocalStorageBackend, StorageBackend
from app.integrations.storage.s3 import S3StorageBackend

_storage: StorageBackend | None = None


def get_storage() -> StorageBackend:
    global _storage
    if _storage is None:
        if settings.storage_backend == "s3":
            _storage = S3StorageBackend()
        else:
            _storage = LocalStorageBackend(settings.storage_local_dir)
    return _storage


def reset_storage() -> None:
    global _storage
    _storage = None
