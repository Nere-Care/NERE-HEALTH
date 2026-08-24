import secrets
from datetime import datetime, timedelta, timezone

from authlib.jose import jwt

from config import settings


def generate_livekit_token(
    room: str,
    identity: str,
    name: str = "",
    ttl_seconds: int = 3600,
) -> str:
    """Génère un JWT LiveKit (HS256) pour rejoindre une salle.

    Format documenté par LiveKit : iss=clé API, sub=identité du participant,
    exp/nbf/jti standards et grant `video` (room + roomJoin).
    """
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.LIVEKIT_API_KEY,
        "sub": identity,
        "exp": int((now + timedelta(seconds=ttl_seconds)).timestamp()),
        "nbf": int((now - timedelta(seconds=5)).timestamp()),
        "iat": int(now.timestamp()),
        "jti": secrets.token_hex(16),
        "video": {
            "room": room,
            "roomJoin": True,
            "canPublish": True,
            "canSubscribe": True,
            "canPublishData": True,
        },
    }
    if name:
        payload["name"] = name
    header = {"alg": "HS256", "typ": "JWT"}
    token = jwt.encode(header, payload, settings.LIVEKIT_API_SECRET)
    return token.decode("utf-8") if isinstance(token, bytes) else token
