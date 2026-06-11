import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    post_type: Mapped[str] = mapped_column(String(10), nullable=False, default="text")

    author_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    subreddit_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("subreddits.id", ondelete="CASCADE"), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)
    upvotes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    downvotes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_nsfw: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_spoiler: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    flair_text: Mapped[str | None] = mapped_column(String(64), nullable=True)
    flair_color: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # Relationships
    votes: Mapped[list["Vote"]] = relationship(
        "Vote", back_populates="post", lazy="noload",
        foreign_keys="Vote.post_id"
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="post", lazy="noload"
    )

    def __repr__(self) -> str:
        return f"<Post id={self.id!r} title={self.title[:30]!r}>"


class Vote(Base):
    __tablename__ = "votes"

    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_vote_user_post"),
        UniqueConstraint("user_id", "comment_id", name="uq_vote_user_comment"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    post_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    comment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    value: Mapped[int] = mapped_column(Integer, nullable=False)  # +1 or -1

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    # Relationships
    post: Mapped["Post | None"] = relationship(
        "Post", back_populates="votes", lazy="noload", foreign_keys=[post_id]
    )
    comment: Mapped["Comment | None"] = relationship(
        "Comment", back_populates="votes", lazy="noload", foreign_keys=[comment_id]
    )

    def __repr__(self) -> str:
        return f"<Vote user_id={self.user_id!r} value={self.value!r}>"


