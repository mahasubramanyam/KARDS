from typing import Generic, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.db.base import Base, SoftDeleteMixin

T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: type[T]) -> None:
        self.db = db
        self.model = model

    def _soft_deleted_guard(self) -> bool:
        return issubclass(self.model, SoftDeleteMixin)

    def query(self) -> Select:
        q = select(self.model)
        if self._soft_deleted_guard():
            q = q.where(self.model.deleted_at.is_(None))
        return q

    def get(self, pk) -> T | None:
        return self.db.get(self.model, pk)

    def get_active(self, pk) -> T | None:
        if self._soft_deleted_guard():
            return self.db.scalar(self.query().where(self.model.id == pk))
        return self.db.get(self.model, pk)

    def list(self, skip: int = 0, limit: int = 50) -> list[T]:
        return list(self.db.scalars(self.query().offset(skip).limit(limit)).all())

    def count(self, *clauses) -> int:
        q = select(func.count()).select_from(self.model)
        if self._soft_deleted_guard():
            q = q.where(self.model.deleted_at.is_(None))
        if clauses:
            q = q.where(*clauses)
        return int(self.db.scalar(q) or 0)

    def add(self, obj: T) -> T:
        self.db.add(obj)
        self.db.flush()
        return obj

    def delete(self, obj: T, hard: bool = False) -> None:
        if hard or not isinstance(obj, SoftDeleteMixin):
            self.db.delete(obj)
        else:
            obj.soft_delete()
        self.db.flush()
