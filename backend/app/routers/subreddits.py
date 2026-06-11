"""
Subreddit routes.

Prefix: /api/r
Tags:   subreddits
"""
from typing import Annotated, Optional

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.subreddit import Subreddit, SubredditMember
from app.models.user import User
from app.routers.auth import bearer_scheme, get_current_user
from app.core.security import decode_token
from app.core.redis import get_redis, is_token_blacklisted
from app.schemas.subreddit import SubredditCreate, SubredditOut, SubredditSummary

from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/r", tags=["subreddits"])


# ---------------------------------------------------------------------------
# Optional auth dependency — returns None if no valid token present
# ---------------------------------------------------------------------------

async def optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
    redis=Depends(get_redis),
) -> Optional[User]:
    if not credentials:
        return None

    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        return None

    user_id: str = payload.get("sub")
    if not user_id:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or user.is_banned:
        return None

    return user


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_subreddit_or_404(name: str, db: AsyncSession) -> Subreddit:
    result = await db.execute(
        select(Subreddit).where(Subreddit.name == name.lower())
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subreddit not found")
    return sub


async def _membership(user_id: str, subreddit_id: str, db: AsyncSession) -> Optional[SubredditMember]:
    result = await db.execute(
        select(SubredditMember).where(
            SubredditMember.user_id == user_id,
            SubredditMember.subreddit_id == subreddit_id,
        )
    )
    return result.scalar_one_or_none()


def _build_subreddit_out(sub: Subreddit, member: Optional[SubredditMember]) -> SubredditOut:
    data = SubredditOut.model_validate(sub)
    if member:
        data.is_member = True
        data.user_role = member.role
    return data


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/", response_model=SubredditOut, status_code=status.HTTP_201_CREATED)
async def create_subreddit(
    payload: SubredditCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check name uniqueness
    existing = await db.execute(
        select(Subreddit).where(Subreddit.name == payload.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"r/{payload.name} already exists",
        )

    sub = Subreddit(
        id=str(uuid.uuid4()),
        name=payload.name,
        display_name=payload.display_name or payload.name,
        description=payload.description,
        is_nsfw=payload.is_nsfw,
        is_private=payload.is_private,
        is_restricted=payload.is_restricted,
        creator_id=current_user.id,
        member_count=1,
    )
    db.add(sub)
    await db.flush()  # get sub.id

    # Creator is auto-joined as owner
    member = SubredditMember(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        subreddit_id=sub.id,
        role="owner",
    )
    db.add(member)
    await db.commit()
    await db.refresh(sub)

    return _build_subreddit_out(sub, member)


@router.get("/popular", response_model=list[SubredditSummary])
async def popular_subreddits(
    db: AsyncSession = Depends(get_db),
):
    """Top 20 subreddits by member count (public)."""
    result = await db.execute(
        select(Subreddit)
        .where(Subreddit.is_private == False)  # noqa: E712
        .order_by(Subreddit.member_count.desc())
        .limit(20)
    )
    subs = result.scalars().all()
    return [SubredditSummary.model_validate(s) for s in subs]


@router.get("/search", response_model=list[SubredditSummary])
async def search_subreddits(
    q: str = Query(..., min_length=1, max_length=100),
    db: AsyncSession = Depends(get_db),
):
    """Search subreddits by name or description (public)."""
    pattern = f"%{q.lower()}%"
    result = await db.execute(
        select(Subreddit)
        .where(
            Subreddit.is_private == False,  # noqa: E712
            or_(
                func.lower(Subreddit.name).like(pattern),
                func.lower(Subreddit.description).like(pattern),
            ),
        )
        .order_by(Subreddit.member_count.desc())
        .limit(25)
    )
    subs = result.scalars().all()
    return [SubredditSummary.model_validate(s) for s in subs]


@router.get("/{name}", response_model=SubredditOut)
async def get_subreddit(
    name: str,
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await _get_subreddit_or_404(name, db)

    member = None
    if current_user:
        member = await _membership(current_user.id, sub.id, db)

    return _build_subreddit_out(sub, member)


@router.post("/{name}/join", status_code=status.HTTP_200_OK)
async def join_or_leave_subreddit(
    name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle join/leave. Returns {joined: bool, member_count: int}."""
    sub = await _get_subreddit_or_404(name, db)
    member = await _membership(current_user.id, sub.id, db)

    if member:
        # Leave — owners cannot leave (they must transfer ownership first)
        if member.role == "owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Owner cannot leave the subreddit. Transfer ownership first.",
            )
        await db.delete(member)
        sub.member_count = max(0, sub.member_count - 1)
        joined = False
    else:
        # Join
        new_member = SubredditMember(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            subreddit_id=sub.id,
            role="member",
        )
        db.add(new_member)
        sub.member_count += 1
        joined = True

    await db.commit()
    await db.refresh(sub)

    return {"joined": joined, "member_count": sub.member_count}
