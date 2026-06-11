from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.chat import Friendship, Message
from app.schemas.chat import FriendshipResponse, MessageCreate, MessageResponse, InboxResponse

router = APIRouter(prefix="/chat", tags=["chat"])


# ---------------------------------------------------------------------------
# Friendships
# ---------------------------------------------------------------------------

@router.post("/friends/{friend_id}", response_model=FriendshipResponse)
async def toggle_friend_request(
    friend_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.id == friend_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
        
    # Check if friend exists
    friend = await db.get(User, friend_id)
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")

    # Check existing relationship
    stmt = select(Friendship).where(
        or_(
            and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
            and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        if existing.status == "pending":
            if existing.friend_id == current_user.id:
                # Accept request
                existing.status = "accepted"
                await db.commit()
                await db.refresh(existing)
                out = FriendshipResponse.model_validate(existing)
                out.friend_username = friend.username
                out.friend_display_name = friend.display_name
                out.friend_avatar_url = friend.avatar_url
                return out
            else:
                raise HTTPException(status_code=400, detail="Friend request already sent")
        elif existing.status == "accepted":
            # Unfriend
            await db.delete(existing)
            await db.commit()
            return FriendshipResponse(
                id=existing.id, user_id=existing.user_id, friend_id=existing.friend_id, status="deleted", created_at=existing.created_at
            )
    else:
        # Create new request
        new_friendship = Friendship(user_id=current_user.id, friend_id=friend_id, status="pending")
        db.add(new_friendship)
        await db.commit()
        await db.refresh(new_friendship)
        
        out = FriendshipResponse.model_validate(new_friendship)
        out.friend_username = friend.username
        out.friend_display_name = friend.display_name
        out.friend_avatar_url = friend.avatar_url
        return out


@router.get("/friends", response_model=List[FriendshipResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Get all friendships involving current_user
    stmt = select(Friendship).where(
        or_(Friendship.user_id == current_user.id, Friendship.friend_id == current_user.id)
    )
    result = await db.execute(stmt)
    friendships = result.scalars().all()

    # Get user details for friends
    friend_ids = []
    for f in friendships:
        friend_ids.append(f.friend_id if f.user_id == current_user.id else f.user_id)
        
    if not friend_ids:
        return []
        
    users_stmt = select(User).where(User.id.in_(friend_ids))
    users_result = await db.execute(users_stmt)
    users_dict = {u.id: u for u in users_result.scalars().all()}

    output = []
    for f in friendships:
        other_id = f.friend_id if f.user_id == current_user.id else f.user_id
        other_user = users_dict.get(other_id)
        if not other_user:
            continue
            
        f_out = FriendshipResponse.model_validate(f)
        f_out.friend_username = other_user.username
        f_out.friend_display_name = other_user.display_name
        f_out.friend_avatar_url = other_user.avatar_url
        output.append(f_out)
        
    return output


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

@router.post("/messages/{recipient_id}", response_model=MessageResponse)
async def send_message(
    recipient_id: str,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Optional: check if they are friends
    friend = await db.get(User, recipient_id)
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")
        
    msg = Message(sender_id=current_user.id, recipient_id=recipient_id, content=data.content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.get("/messages/{other_id}", response_model=List[MessageResponse])
async def get_messages(
    other_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Message).where(
        or_(
            and_(Message.sender_id == current_user.id, Message.recipient_id == other_id),
            and_(Message.sender_id == other_id, Message.recipient_id == current_user.id)
        )
    ).order_by(Message.created_at.asc())
    
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    # Mark unread messages as read
    unread_ids = [m.id for m in messages if m.recipient_id == current_user.id and not m.is_read]
    if unread_ids:
        update_stmt = update(Message).where(Message.id.in_(unread_ids)).values(is_read=True)
        await db.execute(update_stmt)
        await db.commit()
        
    return messages


@router.get("/unread", response_model=int)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(func.count(Message.id)).where(
        and_(Message.recipient_id == current_user.id, Message.is_read == False)
    )
    result = await db.execute(stmt)
    return result.scalar() or 0


@router.get("/inbox", response_model=List[InboxResponse])
async def get_inbox(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Message).where(
        or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id)
    ).order_by(Message.created_at.desc())
    
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    conversations = {}
    
    for msg in messages:
        other_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if other_id not in conversations:
            conversations[other_id] = {
                "latest_message": msg.content,
                "latest_message_at": msg.created_at,
                "unread_count": 0
            }
        
        # count unread
        if msg.recipient_id == current_user.id and not msg.is_read:
            conversations[other_id]["unread_count"] += 1

    if not conversations:
        return []
        
    users_stmt = select(User).where(User.id.in_(conversations.keys()))
    users_result = await db.execute(users_stmt)
    users_dict = {u.id: u for u in users_result.scalars().all()}
    
    output = []
    for other_id, data in conversations.items():
        user = users_dict.get(other_id)
        if not user:
            continue
        output.append(
            InboxResponse(
                friend_id=user.id,
                friend_username=user.username,
                friend_display_name=user.display_name,
                friend_avatar_url=user.avatar_url,
                latest_message=data["latest_message"],
                latest_message_at=data["latest_message_at"],
                unread_count=data["unread_count"],
            )
        )
        
    # Sort by latest message
    output.sort(key=lambda x: x.latest_message_at, reverse=True)
    return output
