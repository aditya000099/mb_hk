from datetime import datetime, timezone


def time_ago(dt: datetime) -> str:
    """Return a human-readable relative time string for a datetime.

    Examples:
        time_ago(datetime.now(UTC) - timedelta(seconds=30))  → "just now"
        time_ago(datetime.now(UTC) - timedelta(minutes=5))   → "5 minutes ago"
        time_ago(datetime.now(UTC) - timedelta(days=2))      → "2 days ago"
    """
    now = datetime.now(timezone.utc)

    # Make dt timezone-aware if it isn't already
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    diff = now - dt
    seconds = int(diff.total_seconds())

    if seconds < 0:
        return "just now"
    elif seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = seconds // 86400
        return f"{days} day{'s' if days != 1 else ''} ago"
    elif seconds < 2592000:
        weeks = seconds // 604800
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    elif seconds < 31536000:
        months = seconds // 2592000
        return f"{months} month{'s' if months != 1 else ''} ago"
    else:
        years = seconds // 31536000
        return f"{years} year{'s' if years != 1 else ''} ago"
