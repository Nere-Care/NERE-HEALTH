from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

DEFAULT_TZ = "Africa/Douala"


def resolve_tz(tz_name: str | None) -> ZoneInfo:
    if not tz_name:
        return ZoneInfo(DEFAULT_TZ)
    try:
        return ZoneInfo(tz_name)
    except Exception:
        return ZoneInfo(DEFAULT_TZ)


def local_today(tz_name: str | None = None) -> date:
    return datetime.now(timezone.utc).astimezone(resolve_tz(tz_name)).date()


def local_now(tz_name: str | None = None) -> datetime:
    return datetime.now(timezone.utc).astimezone(resolve_tz(tz_name))


def to_local(dt: datetime | None, tz_name: str | None = None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(resolve_tz(tz_name))
