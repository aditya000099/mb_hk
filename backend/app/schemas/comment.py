from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=10000)
    parent_comment_id: Optional[str] = None


class CommentUpdate(BaseModel):
    body: str = Field(..., min_length=1, max_length=10000)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    body: str
    author_id: Optional[str]
    post_id: str
    parent_comment_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    score: int
    upvotes: int
    downvotes: int
    is_deleted: bool
    is_mod_removed: bool
    depth: int

    # Enriched from context
    author_username: Optional[str] = None
    user_vote: Optional[int] = None  # +1 / -1 / 0 / None
    replies: list[CommentOut] = []


# Required for the self-referential 'replies' field
CommentOut.model_rebuild()
