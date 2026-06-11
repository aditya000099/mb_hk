from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables
from app.core.redis import init_redis, close_redis
from app.routers import auth, health, subreddits, posts, comments, users, media, search
from fastapi.staticfiles import StaticFiles



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_redis()
    await create_tables()  # dev only — use Alembic in prod
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(subreddits.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(search.router, prefix="/api")

# Mount media folder
app.mount("/media", StaticFiles(directory="media"), name="media")
