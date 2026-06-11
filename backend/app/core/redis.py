import logging
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError
from app.core.config import settings

logger = logging.getLogger(__name__)
redis_client: aioredis.Redis = None

# Fallback in-memory blacklist if Redis is not available locally
_fallback_blacklist = set()

async def get_redis() -> aioredis.Redis:
    """Dependency: returns the shared Redis client."""
    return redis_client


async def init_redis():
    global redis_client
    redis_client = aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis():
    if redis_client:
        await redis_client.aclose()


# Blacklist helpers --------------------------------------------------------

BLACKLIST_PREFIX = "blacklist:"


async def blacklist_token(jti: str, expires_in_seconds: int):
    """Add a JWT id to the blacklist with an expiry matching the token."""
    try:
        await redis_client.setex(f"{BLACKLIST_PREFIX}{jti}", expires_in_seconds, "1")
    except ConnectionError:
        logger.warning("Redis connection failed. Using in-memory fallback for blacklisting.")
        _fallback_blacklist.add(jti)


async def is_token_blacklisted(jti: str) -> bool:
    try:
        result = await redis_client.get(f"{BLACKLIST_PREFIX}{jti}")
        return result is not None
    except ConnectionError:
        return jti in _fallback_blacklist
