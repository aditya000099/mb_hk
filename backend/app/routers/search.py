"""
Search routes.

GET /api/search?q=&type=post|subreddit|user&sort=relevance|new|top&limit=25&after=<cursor>
"""
from typing import Optional, Literal
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.post import Post, Vote
from app.models.subreddit import Subreddit
from app.models.user import User
from app.models.user_profile import SavedPost
from app.routers.subreddits import optional_current_user
from app.schemas.post import PostOut
from app.schemas.subreddit import SubredditSummary
from app.schemas.user import UserOut

router = APIRouter(prefix="/search", tags=["search"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _enrich_post_search(post: Post, db: AsyncSession, current_user: Optional[User]) -> PostOut:
    """Lightweight enrichment for search results."""
    author_username = None
    if post.author_id:
        r = await db.execute(select(User.username).where(User.id == post.author_id))
        author_username = r.scalar_one_or_none()

    r = await db.execute(select(Subreddit.name).where(Subreddit.id == post.subreddit_id))
    subreddit_name = r.scalar_one_or_none()

    user_vote = None
    is_saved = False
    if current_user:
        vr = await db.execute(
            select(Vote.value).where(Vote.user_id == current_user.id, Vote.post_id == post.id)
        )
        user_vote = vr.scalar_one_or_none()
        sr = await db.execute(
            select(SavedPost).where(
                SavedPost.user_id == current_user.id,
                SavedPost.post_id == post.id,
            )
        )
        is_saved = sr.scalar_one_or_none() is not None

    out = PostOut.model_validate(post)
    out.author_username = author_username
    out.subreddit_name = subreddit_name
    out.user_vote = user_vote
    out.is_saved = is_saved
    return out


# ---------------------------------------------------------------------------
# Main Search Endpoint
# ---------------------------------------------------------------------------

@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    type: Optional[Literal["post", "subreddit", "user", "all"]] = Query("all"),
    sort: Literal["relevance", "new", "top"] = Query("relevance"),
    t: Optional[Literal["hour", "day", "week", "month", "year", "all"]] = Query("all"),
    limit: int = Query(25, ge=1, le=100),
    after: Optional[str] = Query(None, description="Cursor for pagination"),
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search posts, subreddits, and users.
    Returns { posts: [...], subreddits: [...], users: [...] } based on `type` filter.
    """
    q_stripped = q.strip()
    if not q_stripped:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")

    pattern = f"%{q_stripped.lower()}%"
    result = {}

    # ── Posts ──────────────────────────────────────────────────────────────
    if type in ("post", "all"):
        post_query = (
            select(Post)
            .where(
                Post.is_deleted == False,  # noqa: E712
                or_(
                    func.lower(Post.title).like(pattern),
                    func.lower(Post.body).like(pattern),
                ),
            )
        )

        # Time filter
        if t and t != "all":
            intervals = {
                "hour": timedelta(hours=1),
                "day": timedelta(days=1),
                "week": timedelta(weeks=1),
                "month": timedelta(days=30),
                "year": timedelta(days=365),
            }
            delta = intervals.get(t)
            if delta:
                cutoff = datetime.now(timezone.utc) - delta
                post_query = post_query.where(Post.created_at >= cutoff)

        # Sorting
        if sort == "new":
            post_query = post_query.order_by(Post.created_at.desc())
        elif sort == "top":
            post_query = post_query.order_by(Post.score.desc(), Post.created_at.desc())
        else:  # relevance — title match ranks higher
            post_query = post_query.order_by(
                func.lower(Post.title).like(pattern).desc(),
                Post.score.desc(),
                Post.created_at.desc(),
            )

        # Cursor pagination (by created_at for simplicity)
        if after:
            cursor_result = await db.execute(select(Post).where(Post.id == after, Post.is_deleted == False))  # noqa: E712
            cursor_post = cursor_result.scalar_one_or_none()
            if cursor_post:
                post_query = post_query.where(Post.created_at < cursor_post.created_at)

        post_query = post_query.limit(limit)
        posts_result = await db.execute(post_query)
        posts = posts_result.scalars().all()
        result["posts"] = [await _enrich_post_search(p, db, current_user) for p in posts]

    # ── Subreddits ─────────────────────────────────────────────────────────
    if type in ("subreddit", "all"):
        sub_query = (
            select(Subreddit)
            .where(
                Subreddit.is_private == False,  # noqa: E712
                or_(
                    func.lower(Subreddit.name).like(pattern),
                    func.lower(Subreddit.description).like(pattern),
                ),
            )
            .order_by(Subreddit.member_count.desc())
            .limit(limit)
        )
        subs_result = await db.execute(sub_query)
        subs = subs_result.scalars().all()
        result["subreddits"] = [SubredditSummary.model_validate(s) for s in subs]

    # ── Users ──────────────────────────────────────────────────────────────
    if type in ("user", "all"):
        user_query = (
            select(User)
            .where(
                User.is_banned == False,  # noqa: E712
                or_(
                    func.lower(User.username).like(pattern),
                    func.lower(User.display_name).like(pattern),
                ),
            )
            .order_by((User.post_karma + User.comment_karma).desc())
            .limit(limit)
        )
        users_result = await db.execute(user_query)
        users = users_result.scalars().all()
        result["users"] = [UserOut.model_validate(u) for u in users]

    return result
