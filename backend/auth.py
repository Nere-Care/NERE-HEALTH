from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError as JoseError
from sqlalchemy.orm import Session

from backend.config import settings
from backend.db import get_db
from backend.jwt_handler import JWTHandler
from backend.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_password_hash(password: str) -> str:
    """Hash a password for storage in the database."""
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def validate_password(password: str) -> None:
    """Validate password strength and reject weak credentials."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit contenir au moins 8 caractères.",
        )
    if password.isalpha() or password.isnumeric():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mot de passe doit contenir des lettres et des chiffres."
            ),
        )
    if password.lower() == password or password.upper() == password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Le mot de passe doit contenir des lettres majuscules "
                "et minuscules."
            ),
        )


def create_access_token(
    subject: str, expires_delta: timedelta | None = None
) -> str:
    """Create a JWT access token for the given subject (user email)."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=60)
    )
    payload = {"sub": subject, "exp": int(expire.timestamp())}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token if isinstance(token, str) else token.decode("utf-8")


def decode_access_token(token: str) -> dict:
    """Decode the JWT token and return the payload."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JoseError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def create_token_pair(user: User) -> dict:
    """
    Crée une paire de tokens (access + refresh) pour un utilisateur.

    Args:
        user: Instance User

    Returns:
        Dict avec access_token et refresh_token
    """
    access_token = JWTHandler.create_access_token(
        user.id, user.email, user.role
    )
    refresh_token = JWTHandler.create_refresh_token(
        user.id, user.email
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": JWTHandler.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # secondes
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    }


def refresh_access_token(
    refresh_token: str,
    db: Session,
    request: Optional[Request] = None,
) -> dict:
    """
    Rafraîchit un token d'accès en utilisant un refresh token.

    Args:
        refresh_token: Token de rafraîchissement
        db: Session de base de données
        request: Objet Request pour audit

    Returns:
        Nouvelle paire de tokens

    Raises:
        HTTPException: Si le refresh token est invalide
    """
    # Valider le refresh token
    payload, error = JWTHandler.validate_token_and_get_user(
        db, refresh_token, "refresh"
    )

    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Refresh token invalide: {error}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Récupérer l'utilisateur
    user_id = UUID(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur inactif ou supprimé",
        )

    # Créer une nouvelle paire de tokens
    token_pair = create_token_pair(user)

    # Logger le refresh pour audit
    from .audit_logger import get_audit_logger
    audit_logger = get_audit_logger(db)
    audit_logger.log_auth_success(
        user_id=user.id,
        email=user.email,
        role=user.role,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("User-Agent") if request else None,
        endpoint="/auth/refresh",
        method="POST",
        additional_data={"action": "token_refresh"}
    )

    return token_pair


def revoke_user_tokens(
    user_id: UUID,
    db: Session,
    reason: str = "admin_revoke",
    request: Optional[Request] = None,
) -> int:
    """
    Révoque tous les tokens actifs d'un utilisateur.

    Args:
        user_id: UUID de l'utilisateur
        db: Session de base de données
        reason: Raison de la révocation
        request: Objet Request pour audit

    Returns:
        Nombre de tokens révoqués
    """
    from .audit_logger import get_audit_logger
    from .token_blacklist import token_blacklist

    audit_logger = get_audit_logger(db)

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        audit_logger.log_admin_action(
            admin_user_id=request.state.user.id if request and hasattr(request.state, 'user') else None,
            action="revoke_user_tokens",
            target_user_id=user_id,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("User-Agent") if request else None,
            additional_data={"reason": reason}
        )

    # Révoquer le token présent dans la requête si available
    revoked_count = 0
    if request and hasattr(request, 'headers'):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

            # Décoder le token pour obtenir son expiration
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                exp_time = datetime.fromtimestamp(payload.get("exp", 0), tz=timezone.utc)

                # Ajouter le token à la blacklist
                if token_blacklist.revoke(token, exp_time):
                    revoked_count = 1

            except Exception as e:
                audit_logger.log_system_error(
                    user_id=user_id,
                    error_code="token_revoke_error",
                    error_message=str(e),
                    endpoint=request.url.path if request else None,
                )

    # Nettoyer la blacklist (optimisation)
    if hasattr(JWTHandler, 'cleanup_expired_blacklist'):
        JWTHandler.cleanup_expired_blacklist(db)

    return revoked_count


def get_user_by_email(db: Session, email: str) -> User | None:
    """Retrieve a user instance from the database by email."""
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Authenticate a user with email and password."""
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
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
    return user


def get_current_user_secure(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Récupère l'utilisateur actuel depuis le middleware JWT sécurisé.

    Args:
        request: Objet Request avec user injecté par le middleware
        db: Session de base de données

    Returns:
        Instance User

    Raises:
        HTTPException: Si l'utilisateur n'est pas authentifié
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user_secure)
) -> User:
    """Return the authenticated user only if their account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif",
        )
    return current_user


def get_current_active_user_secure(
    request: Request,
) -> User:
    """
    Récupère l'utilisateur actif actuel depuis le middleware JWT sécurisé.

    Args:
        request: Objet Request avec user injecté par le middleware

    Returns:
        Instance User

    Raises:
        HTTPException: Si l'utilisateur n'est pas authentifié ou inactif
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utilisateur inactif",
        )
    return user


def require_role(*roles: str):
    """Return a dependency that requires the current user to have one of the
    given roles."""
    def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante",
            )
        return current_user
    return role_checker


def require_role_secure(*roles: str):
    """
    Return a dependency that requires the current user to have one of the
    given roles (version middleware sécurisée).
    """
    def role_checker_secure(request: Request) -> User:
        user = get_current_active_user_secure(request)
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission insuffisante",
            )
        return user
    return role_checker_secure
