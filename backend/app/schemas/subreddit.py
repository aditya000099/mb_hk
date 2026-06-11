from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SubredditCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=3,
        max_length=21,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Subreddit name (3-21 chars, letters/numbers/underscores only)",
    )
    display_name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    is_nsfw: bool = False
    is_private: bool = False
    is_restricted: bool = False

    @field_validator("name")
    @classmethod
    def lowercase_name(cls, v: str) -> str:
        return v.lower()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class SubredditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: Optional[str]
    description: Optional[str]
    sidebar_text: Optional[str]
    icon_url: Optional[str]
    banner_url: Optional[str]
    creator_id: Optional[str]
    member_count: int
    is_nsfw: bool
    is_private: bool
    is_restricted: bool
    created_at: datetime

    # Computed from context (not on the ORM object)
    is_member: bool = False
    user_role: Optional[str] = None


class SubredditSummary(BaseModel):
    """Lightweight subreddit representation for lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: Optional[str]
    description: Optional[str]
    icon_url: Optional[str]
    member_count: int
    is_nsfw: bool
    created_at: datetime
