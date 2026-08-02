from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.models.user import CompanyProfile, NgoProfile, Token, User, VolunteerProfile
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, User)

    def by_email(self, email: str) -> User | None:
        return self.db.scalar(self.query().where(User.email == email.lower()))

    def by_id_active(self, user_id) -> User | None:
        u = self.get_active(user_id)
        if u and not u.is_active:
            return None
        return u


class TokenRepository(BaseRepository[Token]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Token)

    def by_hash(self, token_hash: str, purpose: str) -> Token | None:
        return self.db.scalar(
            select(Token).where(Token.token_hash == token_hash, Token.purpose == purpose)
        )

    def revoke_family(self, family) -> None:
        rows = self.db.scalars(select(Token).where(Token.family == family, Token.revoked_at.is_(None))).all()
        for t in rows:
            t.revoked_at = utcnow()
        self.db.flush()

    def revoke_refresh_for_user(self, user_id) -> None:
        rows = self.db.scalars(
            select(Token).where(
                Token.user_id == user_id,
                Token.purpose == TokenPurpose.REFRESH,
                Token.revoked_at.is_(None),
            )
        ).all()
        for t in rows:
            t.revoked_at = utcnow()
        self.db.flush()


class VolunteerProfileRepository(BaseRepository[VolunteerProfile]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, VolunteerProfile)

    def by_user(self, user_id) -> VolunteerProfile | None:
        return self.db.scalar(select(VolunteerProfile).where(VolunteerProfile.user_id == user_id))


class NgoProfileRepository(BaseRepository[NgoProfile]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, NgoProfile)

    def by_user(self, user_id) -> NgoProfile | None:
        return self.db.scalar(select(NgoProfile).where(NgoProfile.user_id == user_id))


class CompanyProfileRepository(BaseRepository[CompanyProfile]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CompanyProfile)

    def by_user(self, user_id) -> CompanyProfile | None:
        return self.db.scalar(select(CompanyProfile).where(CompanyProfile.user_id == user_id))
