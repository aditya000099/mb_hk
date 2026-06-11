import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)

    author_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    post_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_comment_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    score: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    upvotes: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    downvotes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_mod_removed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    depth: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    post: Mapped["Post"] = relationship(  # type: ignore[name-defined]
        "Post", back_populates="comments", lazy="noload"
    )
    votes: Mapped[list["Vote"]] = relationship(  # type: ignore[name-defined]
        "Vote", back_populates="comment", lazy="noload",
        foreign_keys="Vote.comment_id"
    )
    replies: Mapped[list["Comment"]] = relationship(
        "Comment",
        back_populates="parent",
        lazy="noload",
        foreign_keys="Comment.parent_comment_id",
    )
    parent: Mapped["Comment | None"] = relationship(
        "Comment",
        back_populates="replies",
        lazy="noload",
        remote_side="Comment.id",
        foreign_keys="Comment.parent_comment_id",
    )

    def __repr__(self) -> str:
        return f"<Comment id={self.id!r} post_id={self.post_id!r}>"
