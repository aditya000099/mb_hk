import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Subreddit(Base):
    __tablename__ = "subreddits"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(21), unique=True, nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sidebar_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    creator_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    member_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_nsfw: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_restricted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    # Relationships
    members: Mapped[list["SubredditMember"]] = relationship(
        "SubredditMember", back_populates="subreddit", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Subreddit name={self.name!r} id={self.id!r}>"


class SubredditMember(Base):
    __tablename__ = "subreddit_members"

    __table_args__ = (
        UniqueConstraint("user_id", "subreddit_id", name="uq_subreddit_member"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subreddit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subreddits.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[str] = mapped_column(String(20), default="member", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    # Relationships
    subreddit: Mapped["Subreddit"] = relationship("Subreddit", back_populates="members", lazy="noload")

    def __repr__(self) -> str:
        return f"<SubredditMember user_id={self.user_id!r} subreddit_id={self.subreddit_id!r} role={self.role!r}>"
