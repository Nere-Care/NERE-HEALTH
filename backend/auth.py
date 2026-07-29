import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from authlib.jose import JoseError, jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session as DbSession

from config import settings
from db import get_db
from limiter import limiter
from models import User, Session as UserSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_HOURS = 24


def get_password_hash(password: str) -> str:
    """Hash a password for storage in the database."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def validate_password(password: str) -> None:
    """Validate password strength and reject weak credentials."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères.",
        )
    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins une lettre majuscule.",
        )
    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins une lettre minuscule.",
        )
    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins un chiffre.",
        )
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>_\-+=~`\[\];'\\/]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins un caractère spécial.",
        )


def create_access_token(subject: str, jti: str | None = None) -> str:
    """Create a JWT access token for the given subject (user email)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "jti": jti or secrets.token_hex(16),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    token = jwt.encode(header, payload, settings.SECRET_KEY)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def create_refresh_token() -> str:
    """Generate a cryptographically secure refresh token."""
    return secrets.token_urlsafe(64)


def decode_access_token(token: str) -> dict:
    """Decode the JWT token and return the payload."""
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY)
        return decoded
    except JoseError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_user_by_email(db: DbSession, email: str) -> User | None:
    """Retrieve a user instance from the database by email."""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: DbSession, email: str, password: str) -> User | None:
    """Authenticate a user with email and password."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def _check_session_valid(db: DbSession, jti: str | None, user: User) -> None:
    """Verify that the session (by jti) is not revoked."""
    if not jti:
        return
    session = db.query(UserSession).filter(
        UserSession.access_token_jti == jti,
        UserSession.utilisateur_id == user.id,
    ).first()
    if session and session.revoque:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session révoquée",
            headers={"WWW-Authenticate": "Bearer"},
        )


def create_session(
    db: DbSession,
    user: User,
    access_token_jti: str,
    refresh_token: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> UserSession:
    """Create and persist a new session for the given user."""
    refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    ip = ip_address if ip_address and ip_address != "testclient" else "127.0.0.1"
    session = UserSession(
        utilisateur_id=user.id,
        refresh_token_hash=refresh_hash,
        access_token_jti=access_token_jti,
        ip_address=ip,
        user_agent=(user_agent or "")[:500],
        expires_at=datetime.now(timezone.utc) + timedelta(hours=REFRESH_TOKEN_EXPIRE_HOURS),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: DbSession = Depends(get_db),
) -> User:
    """Validate the current JWT and return the associated user."""
    payload = decode_access_token(token)
    email = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_email(db, email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _check_session_valid(db, payload.get("jti"), user)
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Return the authenticated user only if their account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif",
        )
    return current_user


def require_role(*roles: str):
    """Return a dependency that requires the current user to have one of the given roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante",
            )
        return current_user
    return role_checker
