"""
JWT Token Handler - FAILLE #7: JWT Authentication & Token Rotation

Gère le cycle de vie complet des tokens JWT :
- Création de tokens access et refresh séparés
- Rotation automatique des tokens
- Validation et révocation
- Stockage sécurisé des tokens révoqués (blacklist)
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
import hashlib

import jwt
from sqlalchemy.orm import Session

from .config import _get_settings_instance
from .models import TokenBlacklist, TokenRotationLog, User


class JWTHandler:
    """Gestionnaire JWT sécurisé avec rotation de tokens."""

    # Durées d'expiration
    ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Court terme, renouvellement fréquent
    REFRESH_TOKEN_EXPIRE_DAYS = 7  # Long terme, sécurisé
    TOKEN_ROTATION_THRESHOLD = 5  # Renouveler après 5 min (proactif)

    @staticmethod
    def create_access_token(
        user_data: dict = None,
        user_id: UUID = None,
        email: str = None,
        role: str = None,
        expires_delta: Optional[timedelta] = None,
    ) -> str:
        """
        Crée un token d'accès JWT court terme.

        Args:
            user_id: UUID de l'utilisateur
            email: Email de l'utilisateur
            role: Rôle de l'utilisateur
            expires_delta: Durée d'expiration personnalisée

        Returns:
            Token JWT encodé
        """
        # Support both dict and individual params for backward compatibility
        if isinstance(user_data, dict):
            user_id = user_data.get("sub", user_id)
            email = user_data.get("email", email)
            role = user_data.get("role", role)
        elif user_data is not None and not isinstance(user_data, dict):
            # Accepter la signature historique create_access_token(user_id, email, role)
            if user_id is not None and email is not None and role is None:
                role = email
                email = user_id
                user_id = user_data
            elif user_id is None:
                user_id = user_data

        if expires_delta is None:
            expires_delta = timedelta(minutes=JWTHandler.ACCESS_TOKEN_EXPIRE_MINUTES)

        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user_id),
            "email": email,
            "role": role,
            "type": "access",
            "exp": int(expire.timestamp()),
            "iat": int(datetime.now(timezone.utc).timestamp()),
        }

        token = jwt.encode(
            payload,
            _get_settings_instance().SECRET_KEY,
            algorithm="HS256",
        )
        return token

    @staticmethod
    def create_refresh_token(user_data: dict = None, user_id: UUID = None, email: str = None) -> str:
        """
        Crée un token de rafraîchissement JWT long terme.

        Args:
            user_data: Dict avec user data (support backward compat)
            user_id: UUID de l'utilisateur
            email: Email de l'utilisateur

        Returns:
            Token JWT encodé
        """
        # Support both dict and individual params
        if isinstance(user_data, dict):
            user_id = user_data.get("sub", user_id)
            email = user_data.get("email", email)
        elif user_data is not None and not isinstance(user_data, dict):
            if user_id is not None and email is None:
                email = user_id
                user_id = user_data
            elif user_id is None:
                user_id = user_data

        expire = datetime.now(timezone.utc) + timedelta(days=JWTHandler.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(user_id),
            "email": email,
            "type": "refresh",
            "exp": int(expire.timestamp()),
            "iat": int(datetime.now(timezone.utc).timestamp()),
        }

        token = jwt.encode(
            payload,
            _get_settings_instance().SECRET_KEY,
            algorithm="HS256",
        )
        return token

    @staticmethod
    def decode_token(token: str) -> dict:
        """
        Décode et valide un token JWT.

        Args:
            token: Token JWT à décoder

        Returns:
            Payload du token décodé

        Raises:
            jwt.InvalidTokenError: Si le token est invalide ou expiré
        """
        try:
            payload = jwt.decode(
                token,
                _get_settings_instance().SECRET_KEY,
                algorithms=["HS256"],
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise jwt.InvalidTokenError("Token expiré")
        except jwt.InvalidTokenError as e:
            raise jwt.InvalidTokenError(f"Token invalide: {str(e)}")

    @staticmethod
    def is_token_blacklisted(db: Session, token: str) -> bool:
        """
        Vérifie si un token est dans la blacklist.

        Args:
            db: Session de base de données
            token: Token JWT à vérifier

        Returns:
            True si le token est blacklisté, False sinon
        """
        blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first()
        return blacklisted is not None

    @staticmethod
    def blacklist_token(
        db: Session,
        token: str,
        user_id: UUID,
        reason: str = "logout",
    ) -> None:
        """
        Ajoute un token à la blacklist (révocation).

        Args:
            db: Session de base de données
            token: Token JWT à révoquer
            user_id: UUID de l'utilisateur
            reason: Raison de la révocation
        """
        # Décoder le token pour obtenir l'expiration
        try:
            payload = JWTHandler.decode_token(token)
            exp_timestamp = payload.get("exp")
            expires_at = datetime.fromtimestamp(
                exp_timestamp,
                tz=timezone.utc,
            )
        except jwt.InvalidTokenError:
            # Si le token est déjà expiré, utiliser la date actuelle + 1 jour
            expires_at = datetime.now(timezone.utc) + timedelta(days=1)

        blacklist_entry = TokenBlacklist(
            token=token,
            user_id=user_id,
            reason=reason,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(blacklist_entry)
        db.commit()

    @staticmethod
    def should_rotate_token(token: str) -> bool:
        """
        Détermine si un token doit être roté (renouvellement proactif).

        Un token doit être roté s'il approche de l'expiration.
        Cela permet de maintenir une session active sans reconnecter l'utilisateur.

        Args:
            token: Token JWT à vérifier

        Returns:
            True si le token doit être roté
        """
        try:
            payload = jwt.decode(
                token,
                _get_settings_instance().SECRET_KEY,
                algorithms=["HS256"],
                options={"verify_exp": False},  # Accepter expiré
            )
            exp_timestamp = payload.get("exp", 0)
            iat_timestamp = payload.get("iat", 0)

            # Durée totale du token
            token_lifetime = exp_timestamp - iat_timestamp

            # Temps restant
            time_now = int(datetime.now(timezone.utc).timestamp())
            time_remaining = exp_timestamp - time_now

            # Renouveler si moins de 30% du temps de vie restant
            # (ou moins de 5 minutes)
            rotation_threshold = min(
                int(token_lifetime * 0.3),
                JWTHandler.TOKEN_ROTATION_THRESHOLD * 60,
            )

            return time_remaining < rotation_threshold
        except jwt.InvalidTokenError:
            return False

    @staticmethod
    def validate_token_and_get_user(
        db: Session,
        token: str,
        token_type: str = "access",
    ) -> tuple[Optional[dict], Optional[str]]:
        """
        Valide un token et retourne les données utilisateur ou une erreur.

        Args:
            db: Session de base de données
            token: Token JWT à valider
            token_type: Type de token attendu ('access' ou 'refresh')

        Returns:
            Tuple (payload, error_message) - l'un des deux est None
        """
        # Vérifier blacklist
        if JWTHandler.is_token_blacklisted(db, token):
            return None, "Token révoqué"

        # Décoder et valider
        try:
            payload = JWTHandler.decode_token(token)
        except jwt.InvalidTokenError as e:
            return None, str(e)

        # Vérifier le type de token
        if payload.get("type") != token_type:
            return None, f"Type de token incorrect (attendu: {token_type})"

        # Vérifier que l'utilisateur existe
        user_id = payload.get("sub")
        if not user_id:
            return None, "Payload token invalide"

        user = db.query(User).filter(User.id == UUID(user_id)).first()
        if not user or not user.is_active:
            return None, "Utilisateur inactif ou supprimé"

        return payload, None

    @staticmethod
    def rotate_tokens(
        db: Session,
        old_access_token: str,
        user: User,
        reason: str = "proactive",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[str, str]:
        """
        Effectue une rotation de tokens (renouvellement sécurisé).

        Args:
            db: Session de base de données
            old_access_token: Ancien token d'accès
            user: Utilisateur concerné
            reason: Raison de la rotation
            ip_address: Adresse IP de la requête
            user_agent: User-Agent de la requête

        Returns:
            Tuple (nouveau_access_token, nouveau_refresh_token)
        """
        # Créer les nouveaux tokens
        new_access_token = JWTHandler.create_access_token(user.id, user.email, user.role)
        new_refresh_token = JWTHandler.create_refresh_token(user.id, user.email)

        # Blacklister l'ancien token
        JWTHandler.blacklist_token(db, old_access_token, user.id, "rotation")

        # Logger la rotation pour audit
        old_token_hash = hashlib.sha256(old_access_token.encode()).hexdigest()
        new_token_hash = hashlib.sha256(new_access_token.encode()).hexdigest()

        rotation_log = TokenRotationLog(
            user_id=user.id,
            old_token_hash=old_token_hash,
            new_token_hash=new_token_hash,
            rotation_reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.now(timezone.utc),
        )
        db.add(rotation_log)
        db.commit()

        return new_access_token, new_refresh_token

    @staticmethod
    def cleanup_expired_blacklist(db: Session) -> int:
        """
        Nettoie les tokens expirés de la blacklist (optimisation).

        Args:
            db: Session de base de données

        Returns:
            Nombre de tokens supprimés
        """
        now = datetime.now(timezone.utc)
        deleted = db.query(TokenBlacklist).filter(TokenBlacklist.expires_at < now).delete()
        db.commit()
        return deleted
