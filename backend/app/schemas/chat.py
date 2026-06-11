from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class FriendshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    friend_id: str
    status: str
    created_at: datetime
    # Extra fields added manually in router
    friend_username: Optional[str] = None
    friend_display_name: Optional[str] = None
    friend_avatar_url: Optional[str] = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sender_id: str
    recipient_id: str
    content: str
    is_read: bool
    created_at: datetime


class InboxResponse(BaseModel):
    friend_id: str
    friend_username: str
    friend_display_name: Optional[str]
    friend_avatar_url: Optional[str]
    latest_message: str
    latest_message_at: datetime
    unread_count: int
