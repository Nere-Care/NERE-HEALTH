import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import pyotp
from authlib.jose import JoseError, jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session as DbSession

from config import settings
from db import get_db
from limiter import limiter
from models import User, Session as UserSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_HOURS = 24

LOGIN_MAX_ATTEMPTS = 5
LOGIN_BLOCK_MINUTES = 15


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


# ── Vérification d'email ──────────────────────────────────────────────────

EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = settings.EMAIL_VERIFICATION_EXPIRE_HOURS
EMAIL_OTP_EXPIRE_MINUTES = 15


def generate_verification_code() -> str:
    """Génère un code de confirmation à 6 chiffres."""
    return f"{secrets.randbelow(1_000_000):06d}"


def new_verification_credentials(user: User) -> None:
    """(Ré)génère le jeton de lien et le code OTP de confirmation d'email (synchronisés sur la même durée)."""
    expires = datetime.now(timezone.utc) + timedelta(
        hours=EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
    )
    user.email_verification_token = secrets.token_urlsafe(32)
    user.email_verification_expires = expires
    user.email_otp = generate_verification_code()
    user.email_otp_expires = expires


def _ensure_aware(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def verify_email_by_token(db: DbSession, token: str) -> User | None:
    """Active le compte si le jeton de confirmation est valide (et le renvoie)."""
    user = (
        db.query(User)
        .filter(
            User.email_verification_token == token,
            User.email_verification_token.isnot(None),
        )
        .first()
    )
    if not user:
        return None
    expires = _ensure_aware(user.email_verification_expires)
    if expires and expires < datetime.now(timezone.utc):
        return None
    _mark_email_verified(db, user)
    return user


def verify_email_by_code(db: DbSession, email: str, code: str) -> User | None:
    """Active le compte si l'email + code OTP sont valides (et le renvoie)."""
    user = get_user_by_email(db, email)
    if not user or user.email_verifie:
        return None
    if not user.email_otp or user.email_otp != code:
        return None
    expires = _ensure_aware(user.email_otp_expires)
    if expires and expires < datetime.now(timezone.utc):
        return None
    _mark_email_verified(db, user)
    return user


def _mark_email_verified(db: DbSession, user: User) -> None:
    user.email_verifie = True
    user.email_verification_token = None
    user.email_verification_expires = None
    user.email_otp = None
    user.email_otp_expires = None
    if user.role != "medecin":
        user.statut = "actif"
    db.add(user)
    db.commit()
    db.refresh(user)


# ── Double authentification (TOTP) ────────────────────────────────────────

TWOFA_TOKEN_EXPIRE_MINUTES = 10


def create_twofa_token(subject: str) -> str:
    """Jeton court de courte durée utilisé pour valider l'étape 2FA du login."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=TWOFA_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "purpose": "twofa",
        "exp": int(expire.timestamp()),
        "iat": int(datetime.now(timezone.utc).timestamp()),
    }
    header = {"alg": "HS256", "typ": "JWT"}
    token = jwt.encode(header, payload, settings.SECRET_KEY)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def decode_twofa_token(token: str) -> str:
    """Décode un jeton 2FA et renvoie l'email, ou lève une 401."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY)
        if payload.get("purpose") != "twofa" or not payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Jeton 2FA invalide",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload["sub"]
    except JoseError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton 2FA invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def new_totp_secret() -> str:
    """Génère un secret TOTP pour un nouveau setup 2FA."""
    return pyotp.random_base32()


def verify_totp(user: User, code: str) -> bool:
    """Vérifie un code TOTP contre le secret du compte."""
    if not user.totp_secret:
        return False
    try:
        totp = pyotp.TOTP(user.totp_secret)
        return totp.verify(code, valid_window=1)
    except Exception:
        return False


def get_block_remaining_seconds(user: User) -> float | None:
    """Return remaining seconds of a temporary login block, or None if not blocked."""
    if not user.bloque_jusqu_a:
        return None
    bloque = user.bloque_jusqu_a
    if bloque.tzinfo is None:
        bloque = bloque.replace(tzinfo=timezone.utc)
    remaining = (bloque - datetime.now(timezone.utc)).total_seconds()
    return remaining if remaining > 0 else None


def register_failed_login(db: DbSession, user: User) -> None:
    """Increment the failed-attempt counter and temporarily block the account at the threshold."""
    user.nb_tentatives_connexion = (user.nb_tentatives_connexion or 0) + 1
    if user.nb_tentatives_connexion >= LOGIN_MAX_ATTEMPTS:
        user.bloque_jusqu_a = datetime.now(timezone.utc) + timedelta(minutes=LOGIN_BLOCK_MINUTES)
        user.nb_tentatives_connexion = 0
    db.add(user)
    db.commit()


def reset_login_attempts(db: DbSession, user: User) -> None:
    """Clear the failed-attempt counter and any temporary block after a successful login."""
    user.nb_tentatives_connexion = 0
    user.bloque_jusqu_a = None
    db.add(user)
    db.commit()


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
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: DbSession = Depends(get_db),
) -> User:
    """Validate the current JWT and return the associated user."""
    actual_token = request.cookies.get("access_token") or token
    if actual_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token manquant",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(actual_token)
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
