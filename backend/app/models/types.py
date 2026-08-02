from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import mapped_column


def enum_col(
    enum_cls: type,
    default: object | None = None,
    nullable: bool = False,
    unique: bool = False,
    index: bool = False,
):
    return mapped_column(
        SAEnum(enum_cls, native_enum=False, length=40),
        nullable=nullable,
        default=default,
        unique=unique,
        index=index,
    )


def fk_col(target: str, nullable: bool = False, ondelete: str = "CASCADE"):
    return mapped_column(Uuid, ForeignKey(target, ondelete=ondelete), nullable=nullable)
