"""
Comment routes.

Prefix: /api
Tags:   comments
"""
from typing import Optional, Literal
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.post import Post, Vote
from app.models.comment import Comment
from app.models.user import User
from app.models.user_profile import SavedComment
from app.routers.auth import get_current_user
from app.routers.subreddits import optional_current_user
from app.schemas.comment import CommentCreate, CommentOut

router = APIRouter(tags=["comments"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_comment_or_404(comment_id: str, db: AsyncSession) -> Comment:
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.is_deleted == False)  # noqa: E712
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    return comment


async def _get_user_vote_for_comment(user_id: str, comment_id: str, db: AsyncSession) -> Optional[int]:
    result = await db.execute(
        select(Vote.value).where(Vote.user_id == user_id, Vote.comment_id == comment_id)
    )
    return result.scalar_one_or_none()


async def _author_username(author_id: Optional[str], db: AsyncSession) -> Optional[str]:
    if not author_id:
        return None
    result = await db.execute(select(User.username).where(User.id == author_id))
    return result.scalar_one_or_none()


def _build_comment_tree(
    comments: list[Comment],
    author_map: dict[str, str],
    vote_map: dict[str, int],
    sort: str,
    parent_id: Optional[str] = None,
    depth: int = 0,
    top_level_limit: int = 100,
    child_limit: int = 50,
) -> list[CommentOut]:
    """Recursively build comment tree sorted by score."""
    children = [c for c in comments if c.parent_comment_id == parent_id]

    if sort == "best":
        children.sort(key=lambda c: c.score, reverse=True)
    else:  # new
        children.sort(key=lambda c: c.created_at, reverse=True)

    limit = top_level_limit if parent_id is None else child_limit
    children = children[:limit]

    result = []
    for comment in children:
        out = CommentOut.model_validate(comment)
        out.author_username = author_map.get(comment.author_id or "")
        out.user_vote = vote_map.get(comment.id)
        out.replies = _build_comment_tree(
            comments, author_map, vote_map, sort,
            parent_id=comment.id,
            depth=depth + 1,
            top_level_limit=top_level_limit,
            child_limit=child_limit,
        )
        result.append(out)

    return result


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: str,
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify post exists and is not locked/deleted
    post_result = await db.execute(
        select(Post).where(Post.id == post_id, Post.is_deleted == False)  # noqa: E712
    )
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.is_locked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Post is locked")

    # Verify parent comment if provided
    depth = 0
    if payload.parent_comment_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == payload.parent_comment_id)
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found")
        depth = parent.depth + 1

    comment = Comment(
        id=str(uuid.uuid4()),
        body=payload.body,
        author_id=current_user.id,
        post_id=post_id,
        parent_comment_id=payload.parent_comment_id,
        depth=depth,
        score=1,
        upvotes=1,
        downvotes=0,
    )
    db.add(comment)

    # Auto-upvote by author
    vote = Vote(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        comment_id=comment.id,
        value=1,
    )
    db.add(vote)

    # Increment post comment count
    post.comment_count += 1

    await db.commit()
    await db.refresh(comment)

    out = CommentOut.model_validate(comment)
    out.author_username = current_user.username
    out.user_vote = 1
    return out


@router.get("/posts/{post_id}/comments", response_model=list[CommentOut])
async def get_comments(
    post_id: str,
    sort: Literal["best", "new"] = "best",
    current_user: Optional[User] = Depends(optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch the full comment tree for a post."""
    # Verify post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id, Post.is_deleted == False)  # noqa: E712
    )
    if not post_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Fetch all comments for this post (including deleted — body replaced)
    comments_result = await db.execute(
        select(Comment).where(Comment.post_id == post_id)
    )
    all_comments: list[Comment] = comments_result.scalars().all()

    if not all_comments:
        return []

    # Build author username map
    author_ids = list({c.author_id for c in all_comments if c.author_id})
    author_map: dict[str, str] = {}
    if author_ids:
        users_result = await db.execute(
            select(User.id, User.username).where(User.id.in_(author_ids))
        )
        for row in users_result.all():
            author_map[row.id] = row.username

    # Build vote map for current user
    vote_map: dict[str, int] = {}
    if current_user:
        comment_ids = [c.id for c in all_comments]
        votes_result = await db.execute(
            select(Vote.comment_id, Vote.value).where(
                Vote.user_id == current_user.id,
                Vote.comment_id.in_(comment_ids),
            )
        )
        for row in votes_result.all():
            vote_map[row.comment_id] = row.value

    # Replace deleted comment bodies
    for c in all_comments:
        if c.is_deleted:
            c.body = "[deleted]"
            c.author_id = None

    return _build_comment_tree(all_comments, author_map, vote_map, sort)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await _get_comment_or_404(comment_id, db)
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    comment.is_deleted = True
    comment.body = "[deleted]"
    comment.author_id = None

    # Decrement post comment count
    post_result = await db.execute(select(Post).where(Post.id == comment.post_id))
    post = post_result.scalar_one_or_none()
    if post:
        post.comment_count = max(0, post.comment_count - 1)

    await db.commit()


@router.post("/comments/{comment_id}/vote", response_model=dict)
async def vote_comment(
    comment_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vote on a comment. Body: {value: -1|0|1}"""
    from app.schemas.post import VoteIn
    vote_in = VoteIn(**payload)

    comment = await _get_comment_or_404(comment_id, db)

    existing_result = await db.execute(
        select(Vote).where(Vote.user_id == current_user.id, Vote.comment_id == comment_id)
    )
    existing_vote = existing_result.scalar_one_or_none()

    if vote_in.value == 0:
        if existing_vote:
            if existing_vote.value == 1:
                comment.upvotes = max(0, comment.upvotes - 1)
            else:
                comment.downvotes = max(0, comment.downvotes - 1)
            await db.delete(existing_vote)
    elif existing_vote is None:
        new_vote = Vote(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            comment_id=comment_id,
            value=vote_in.value,
        )
        db.add(new_vote)
        if vote_in.value == 1:
            comment.upvotes += 1
        else:
            comment.downvotes += 1
    elif existing_vote.value == vote_in.value:
        # Unvote
        if vote_in.value == 1:
            comment.upvotes = max(0, comment.upvotes - 1)
        else:
            comment.downvotes = max(0, comment.downvotes - 1)
        await db.delete(existing_vote)
        vote_in = type(vote_in)(value=0)
    else:
        # Flip vote
        existing_vote.value = vote_in.value
        if vote_in.value == 1:
            comment.upvotes += 1
            comment.downvotes = max(0, comment.downvotes - 1)
        else:
            comment.downvotes += 1
            comment.upvotes = max(0, comment.upvotes - 1)

    comment.score = comment.upvotes - comment.downvotes
    await db.commit()
    await db.refresh(comment)

    user_vote = await _get_user_vote_for_comment(current_user.id, comment_id, db)
    return {
        "score": comment.score,
        "upvotes": comment.upvotes,
        "downvotes": comment.downvotes,
        "user_vote": user_vote,
    }


@router.post("/comments/{comment_id}/save")
async def toggle_save_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comment = await db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    stmt = select(SavedComment).where(SavedComment.user_id == current_user.id, SavedComment.comment_id == comment_id)
    saved = (await db.execute(stmt)).scalar_one_or_none()
    
    if saved:
        await db.delete(saved)
        action = "unsaved"
    else:
        new_save = SavedComment(user_id=current_user.id, comment_id=comment_id)
        db.add(new_save)
        action = "saved"
        
    await db.commit()
    return {"status": action}
