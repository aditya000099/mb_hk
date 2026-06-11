from datetime import datetime, timedelta, timezone
from typing import Optional
import hashlib

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def _normalize_password(password: str) -> bytes:
    """
    Pre-hash with SHA-256 so passwords >72 bytes are handled safely
    (bcrypt silently truncates at 72 bytes; this avoids that pitfall).
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(_normalize_password(password), bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        _normalize_password(plain_password),
        hashed_password.encode("utf-8"),
    )


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None
