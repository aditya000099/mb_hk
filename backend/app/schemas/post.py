from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict, model_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class PostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    body: Optional[str] = Field(None, max_length=40000)
    url: Optional[str] = Field(None, max_length=2048)
    post_type: Literal["text", "link", "image"] = "text"
    subreddit_name: str = Field(..., min_length=3, max_length=21)
    is_nsfw: bool = False
    is_spoiler: bool = False
    flair_text: Optional[str] = Field(None, max_length=64)

    @model_validator(mode="after")
    def validate_post_content(self) -> "PostCreate":
        if self.post_type == "link" and not self.url:
            raise ValueError("url is required for link posts")
        if self.post_type == "image" and not self.image_url and not self.url:
            pass  # image_url may come via upload separately
        return self

    image_url: Optional[str] = Field(None, max_length=2048)


class VoteIn(BaseModel):
    value: int = Field(..., description="Vote value: +1 (upvote), -1 (downvote), 0 (remove vote)")

    @model_validator(mode="after")
    def validate_value(self) -> "VoteIn":
        if self.value not in (-1, 0, 1):
            raise ValueError("value must be -1, 0, or 1")
        return self


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    body: Optional[str]
    url: Optional[str]
    image_url: Optional[str]
    post_type: str
    author_id: Optional[str]
    subreddit_id: str
    created_at: datetime
    updated_at: datetime
    score: int
    upvotes: int
    downvotes: int
    comment_count: int
    is_nsfw: bool
    is_spoiler: bool
    is_locked: bool
    is_deleted: bool
    flair_text: Optional[str]
    flair_color: Optional[str]

    # Enriched from joins / context
    author_username: Optional[str] = None
    subreddit_name: Optional[str] = None
    user_vote: Optional[int] = None  # +1 / -1 / 0 / None


class VoteResponse(BaseModel):
    score: int
    upvotes: int
    downvotes: int
    user_vote: Optional[int]
