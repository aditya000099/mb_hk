from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.routers.subreddits import optional_current_user as get_optional_current_user
from app.models.user import User
from app.models.post import Post, Vote
from app.models.comment import Comment
from app.models.subreddit import Subreddit
from app.models.user_profile import SavedPost, SavedComment
from app.schemas.user import UserOut, UserUpdate
from app.schemas.post import PostOut
from app.schemas.comment import CommentOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me/saved")
async def get_saved_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch saved posts
    posts_query = (
        select(SavedPost, Post)
        .join(Post, SavedPost.post_id == Post.id)
        .where(SavedPost.user_id == current_user.id)
        .order_by(desc(SavedPost.created_at))
    )
    posts_result = await db.execute(posts_query)
    saved_posts = posts_result.all()

    # Fetch saved comments
    comments_query = (
        select(SavedComment, Comment)
        .join(Comment, SavedComment.comment_id == Comment.id)
        .where(SavedComment.user_id == current_user.id)
        .order_by(desc(SavedComment.created_at))
    )
    comments_result = await db.execute(comments_query)
    saved_comments = comments_result.all()

    items = []
    
    for sp, post in saved_posts:
        # Fetch subreddit and author for enrichment
        # In a real app we'd do a join above, but for simplicity here
        author = await db.get(User, post.author_id) if post.author_id else None
        subreddit = await db.get(Subreddit, post.subreddit_id) if post.subreddit_id else None
        
        post_out = PostOut.model_validate(post)
        post_out.author_username = author.username if author else "[deleted]"
        post_out.subreddit_name = subreddit.name if subreddit else "unknown"
        items.append({"type": "post", "saved_at": sp.created_at.timestamp(), "data": post_out})
        
    for sc, comment in saved_comments:
        author = await db.get(User, comment.author_id) if comment.author_id else None
        comment_out = CommentOut.model_validate(comment)
        comment_out.author_username = author.username if author else "[deleted]"
        items.append({"type": "comment", "saved_at": sc.created_at.timestamp(), "data": comment_out})
        
    # Sort by saved_at desc
    items.sort(key=lambda x: x["saved_at"], reverse=True)
    return {"items": items}


@router.get("/{username}", response_model=UserOut)
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.username == username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


@router.put("/me", response_model=UserOut)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if data.display_name is not None:
        current_user.display_name = data.display_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.banner_url is not None:
        current_user.banner_url = data.banner_url

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/{username}/posts")
async def get_user_posts(
    username: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.username == username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    post_stmt = (
        select(Post, Subreddit)
        .outerjoin(Subreddit, Post.subreddit_id == Subreddit.id)
        .where(Post.author_id == user.id)
        .order_by(desc(Post.created_at))
        .limit(20)
    )
    result = await db.execute(post_stmt)
    rows = result.all()

    posts = []
    for post, subreddit in rows:
        post_out = PostOut.model_validate(post)
        post_out.author_username = user.username
        post_out.subreddit_name = subreddit.name if subreddit else "unknown"
        
        # User vote
        if current_user:
            vote_stmt = select(Vote).where(Vote.post_id == post.id, Vote.user_id == current_user.id)
            vote = (await db.execute(vote_stmt)).scalar_one_or_none()
            post_out.user_vote = vote.value if vote else 0
            
        posts.append(post_out)
        
    return {"posts": posts}


@router.get("/{username}/comments")
async def get_user_comments(
    username: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(User).where(User.username == username)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    comment_stmt = (
        select(Comment)
        .where(Comment.author_id == user.id)
        .order_by(desc(Comment.created_at))
        .limit(20)
    )
    result = await db.execute(comment_stmt)
    comments = result.scalars().all()

    out = []
    for c in comments:
        cout = CommentOut.model_validate(c)
        cout.author_username = user.username
        if current_user:
            vote_stmt = select(Vote).where(Vote.comment_id == c.id, Vote.user_id == current_user.id)
            vote = (await db.execute(vote_stmt)).scalar_one_or_none()
            cout.user_vote = vote.value if vote else 0
        out.append(cout)
        
    return {"comments": out}
