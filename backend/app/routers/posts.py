"""
Post routes.

Prefix: /api  (mounts as /api/r/{sub}/posts, /api/posts/{id}, /api/feed/*)
Tags:   posts
"""
from typing import Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.post import Post, Vote
from app.models.subreddit import Subreddit, SubredditMember
from app.models.user import User
from app.models.comment import Comment  # noqa: F401 — needed for relationship resolution
from app.models.user_profile import SavedPost
from app.routers.auth import get_current_user
from app.routers.subreddits import optional_current_user
from app.schemas.post import PostCreate, PostOut, PostUpdate, VoteIn, VoteResponse

router = APIRouter(tags=["posts"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _get_post_or_404(post_id: str, db: AsyncSession) -> Post:
    result = await db.execute(select(Post).where(Post.id == post_id, Post.is_deleted == False))  # noqa: E712
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


async def _get_user_vote_for_post(user_id: str, post_id: str, db: AsyncSession) -> Optional[int]:
    result = await db.execute(
        select(Vote.value).where(Vote.user_id == user_id, Vote.post_id == post_id)
    )
    row = result.scalar_one_or_none()
    return row


async def _enrich_post(post: Post, db: AsyncSession, current_user: Optional[User] = None) -> PostOut:
    """Load author username, subreddit name, user_vote, and is_saved."""
    author_username = None
    if post.author_id:
        r = await db.execute(select(User.username).where(User.id == post.author_id))
        author_username = r.scalar_one_or_none()

    r = await db.execute(select(Subreddit.name).where(Subreddit.id == post.subreddit_id))
    subreddit_name = r.scalar_one_or_none()

    user_vote = None
    is_saved = False
    if current_user:
        user_vote = await _get_user_vote_for_post(current_user.id, post.id, db)
        saved_result = await db.execute(
            select(SavedPost).where(
                SavedPost.user_id == current_user.id,
                SavedPost.post_id == post.id,
            )
        )
        is_saved = saved_result.scalar_one_or_none() is not None

    out = PostOut.model_validate(post)
    out.author_username = author_username
    out.subreddit_name = subreddit_name
    out.user_vote = user_vote
    out.is_saved = is_saved
    return out


def _apply_sort(query, sort: str, t: Optional[str] = None):
    """Apply sort ordering to a SQLAlchemy select query for posts."""
    if sort == "new":
        return query.order_by(Post.created_at.desc())

    if sort == "top":
        query = query.order_by(Post.score.desc(), Post.created_at.desc())
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
                cutoff = utcnow() - delta
                query = query.where(Post.created_at >= cutoff)
        return query

    if sort == "rising":
        # Posts from the last 6 hours sorted by score/age ratio
        cutoff = utcnow() - timedelta(hours=6)
        return (
            query
            .where(Post.created_at >= cutoff)
            .order_by(
                (Post.score / func.greatest(
                    func.extract("epoch", func.now() - Post.created_at) / 3600,
                    0.1
                )).desc()
            )
        )

    # Default: "hot" — Wilson-like score
    return query.order_by(
        (
            (Post.score + 1) /
            func.power(
                func.extract("epoch", func.now() - Post.created_at) / 3600 + 2,
                1.5
            )
        ).desc()
    )


# ---------------------------------------------------------------------------
# Create Post
# ---------------------------------------------------------------------------

@router.post("/r/{subreddit_name}/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    subreddit_name: str,
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Resolve subreddit
    result = await db.execute(
        select(Subreddit).where(Subreddit.name == subreddit_name.lower())
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subreddit not found")

    # Membership check
    member_result = await db.execute(
        select(SubredditMember).where(
            SubredditMember.user_id == current_user.id,
            SubredditMember.subreddit_id == sub.id,
        )
    )
    existing_member = member_result.scalar_one_or_none()

    if not existing_member:
        if sub.is_private or sub.is_restricted:
            # Private / restricted subreddits require explicit membership
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must join the subreddit before posting",
            )
        # Public subreddit — auto-join the user (same as Reddit's behaviour)
        new_member = SubredditMember(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            subreddit_id=sub.id,
            role="member",
        )
        db.add(new_member)
        sub.member_count = (sub.member_count or 0) + 1

    post = Post(
        id=str(uuid.uuid4()),
        title=payload.title,
        body=payload.body,
        url=payload.url,
        image_url=payload.image_url,
        post_type=payload.post_type,
        author_id=current_user.id,
        subreddit_id=sub.id,
        is_nsfw=payload.is_nsfw,
        is_spoiler=payload.is_spoiler,
        flair_text=payload.flair_text,
        score=1,
        upvotes=1,
        downvotes=0,
    )
    db.add(post)

    # Auto-upvote by author
    vote = Vote(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        post_id=post.id,
        value=1,
    )
    db.add(vote)

    await db.commit()
    await db.refresh(post)

    return await _enrich_post(post, db, current_user)


# ---------------------------------------------------------------------------
# List Posts for a Subreddit
# ---------------------------------------------------------------------------

@router.get("/r/{subreddit_name}/posts", response_model=list[PostOut])
async def list_subreddit_posts(
    subreddit_name: str,
    sort: Literal["hot", "new", "top", "rising"] = "hot",
    t: Optional[str] = Query(None, description="Time filter for 'top': hour/day/week/month/year/all"),
    after: Optional[str] = Query(None, description="Cursor: last post id for pagination"),
    limit: int = Query(25, ge=1, le=100),
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subreddit).where(Subreddit.name == subreddit_name.lower())
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subreddit not found")

    query = (
        select(Post)
        .where(Post.subreddit_id == sub.id, Post.is_deleted == False)  # noqa: E712
    )
    query = _apply_sort(query, sort, t)

    if after:
        # Fetch the cursor post to get its sort key
        cursor_result = await db.execute(select(Post).where(Post.id == after))
        cursor_post = cursor_result.scalar_one_or_none()
        if cursor_post:
            query = query.where(Post.created_at < cursor_post.created_at)

    query = query.limit(limit)
    posts_result = await db.execute(query)
    posts = posts_result.scalars().all()

    return [await _enrich_post(p, db, current_user) for p in posts]


# ---------------------------------------------------------------------------
# Get Single Post
# ---------------------------------------------------------------------------

@router.get("/posts/{post_id}", response_model=PostOut)
async def get_post(
    post_id: str,
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_or_404(post_id, db)
    return await _enrich_post(post, db, current_user)


# ---------------------------------------------------------------------------
# Delete Post (soft)
# ---------------------------------------------------------------------------

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_or_404(post_id, db)
    if post.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    post.is_deleted = True
    post.body = "[deleted]"
    await db.commit()


# ---------------------------------------------------------------------------
# Edit Post
# ---------------------------------------------------------------------------

@router.put("/posts/{post_id}", response_model=PostOut)
async def edit_post(
    post_id: str,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a post's title and/or body. Only the author can edit."""
    post = await _get_post_or_404(post_id, db)

    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    if post.is_locked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Post is locked")

    if payload.title is not None:
        if not payload.title.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Title cannot be empty")
        post.title = payload.title.strip()

    if payload.body is not None:
        post.body = payload.body

    await db.commit()
    await db.refresh(post)
    return await _enrich_post(post, db, current_user)


# ---------------------------------------------------------------------------
# Vote on Post
# ---------------------------------------------------------------------------

@router.post("/posts/{post_id}/vote", response_model=VoteResponse)
async def vote_post(
    post_id: str,
    payload: VoteIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _get_post_or_404(post_id, db)

    existing_result = await db.execute(
        select(Vote).where(Vote.user_id == current_user.id, Vote.post_id == post_id)
    )
    existing_vote = existing_result.scalar_one_or_none()

    if payload.value == 0:
        # Remove vote
        if existing_vote:
            if existing_vote.value == 1:
                post.upvotes = max(0, post.upvotes - 1)
            else:
                post.downvotes = max(0, post.downvotes - 1)
            await db.delete(existing_vote)
        # else: nothing to do
    elif existing_vote is None:
        # New vote
        new_vote = Vote(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            post_id=post_id,
            value=payload.value,
        )
        db.add(new_vote)
        if payload.value == 1:
            post.upvotes += 1
        else:
            post.downvotes += 1
    elif existing_vote.value == payload.value:
        # Same vote → unvote
        if payload.value == 1:
            post.upvotes = max(0, post.upvotes - 1)
        else:
            post.downvotes = max(0, post.downvotes - 1)
        await db.delete(existing_vote)
        payload = VoteIn(value=0)  # reflect no vote
    else:
        # Opposite vote → flip
        existing_vote.value = payload.value
        if payload.value == 1:
            post.upvotes += 1
            post.downvotes = max(0, post.downvotes - 1)
        else:
            post.downvotes += 1
            post.upvotes = max(0, post.upvotes - 1)

    post.score = post.upvotes - post.downvotes

    # --- Karma tracking (skip self-votes) ---
    # karma_delta represents how much the author's post_karma should change
    karma_delta = 0
    old_vote_value = existing_vote.value if existing_vote else 0

    if payload.value == 0:
        # Unvote: reverse previous vote
        karma_delta = -old_vote_value
    elif old_vote_value == 0:
        # New vote
        karma_delta = payload.value
    elif old_vote_value == payload.value:
        # Toggle off (same vote clicked again)
        karma_delta = -payload.value
    else:
        # Flip vote (e.g. downvote -> upvote)
        karma_delta = payload.value - old_vote_value  # e.g. 1 - (-1) = 2

    if karma_delta != 0 and post.author_id and post.author_id != current_user.id:
        author_result = await db.execute(select(User).where(User.id == post.author_id))
        author = author_result.scalar_one_or_none()
        if author:
            author.post_karma = max(0, author.post_karma + karma_delta)

    await db.commit()
    await db.refresh(post)

    user_vote = await _get_user_vote_for_post(current_user.id, post_id, db)
    return VoteResponse(
        score=post.score,
        upvotes=post.upvotes,
        downvotes=post.downvotes,
        user_vote=user_vote,
    )


# ---------------------------------------------------------------------------
# Home Feed
# ---------------------------------------------------------------------------

@router.get("/feed", response_model=list[PostOut])
async def home_feed(
    sort: Literal["hot", "new", "top", "best", "rising"] = "best",
    after: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    If authenticated: posts from subscribed subreddits.
    If not: popular posts from all public subreddits.
    'best' is treated as 'hot'.
    """
    effective_sort = "hot" if sort == "best" else sort

    query = select(Post).where(Post.is_deleted == False)  # noqa: E712

    if current_user:
        # Get subscribed subreddit IDs
        sub_ids_result = await db.execute(
            select(SubredditMember.subreddit_id).where(
                SubredditMember.user_id == current_user.id
            )
        )
        sub_ids = [row for row in sub_ids_result.scalars().all()]
        if sub_ids:
            query = query.where(Post.subreddit_id.in_(sub_ids))

    query = _apply_sort(query, effective_sort)

    if after:
        cursor_result = await db.execute(select(Post).where(Post.id == after))
        cursor_post = cursor_result.scalar_one_or_none()
        if cursor_post:
            query = query.where(Post.created_at < cursor_post.created_at)

    query = query.limit(limit)
    posts_result = await db.execute(query)
    posts = posts_result.scalars().all()

    return [await _enrich_post(p, db, current_user) for p in posts]


# ---------------------------------------------------------------------------
# Popular Feed
# ---------------------------------------------------------------------------

@router.get("/feed/popular", response_model=list[PostOut])
async def popular_feed(
    sort: Literal["hot", "new", "top", "rising"] = "hot",
    t: Optional[str] = Query(None),
    after: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """r/popular — all public posts."""
    query = select(Post).where(Post.is_deleted == False)  # noqa: E712
    query = _apply_sort(query, sort, t)

    if after:
        cursor_result = await db.execute(select(Post).where(Post.id == after))
        cursor_post = cursor_result.scalar_one_or_none()
        if cursor_post:
            query = query.where(Post.created_at < cursor_post.created_at)

    query = query.limit(limit)
    posts_result = await db.execute(query)
    posts = posts_result.scalars().all()

    return [await _enrich_post(p, db, current_user) for p in posts]


@router.post("/posts/{post_id}/save")
async def toggle_save_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    stmt = select(SavedPost).where(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id)
    saved = (await db.execute(stmt)).scalar_one_or_none()
    
    if saved:
        await db.delete(saved)
        action = "unsaved"
    else:
        new_save = SavedPost(user_id=current_user.id, post_id=post_id)
        db.add(new_save)
        action = "saved"
        
    await db.commit()
    return {"status": action}
