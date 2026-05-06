"""
Encryption Module - FAILLE #8: Data Encryption

Chiffrement des données sensibles en transit et au repos :
- Chiffrement des champs PII (email, téléphone, données médicales)
- Hachage avec salt pour les mots de passe
- Chiffrement Fernet pour les champs sensibles
- HTTPS enforcement avec HSTS headers
"""

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os
import base64
import binascii
import logging
from typing import Optional

from .config import settings

logger = logging.getLogger(__name__)


class EncryptionManager:
    """Gestionnaire de chiffrement pour les données sensibles."""

    def __init__(self):
        """Initialise le gestionnaire avec la clé de chiffrement."""
        self.backend = default_backend()
        self._cipher_suite = None
        self._init_cipher()

    def _init_cipher(self):
        """Initialise la suite de chiffrement Fernet."""
        try:
            # Utiliser la clé secrète de config pour générer une clé Fernet
            # Fernet nécessite une clé en base64 de 32 bytes
            key_material = settings.SECRET_KEY.encode()

            # Dériver une clé de 32 bytes depuis SECRET_KEY
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b"nere_app_salt_v1",
                iterations=100000,
                backend=self.backend,
            )
            derived_key = kdf.derive(key_material)

            # Encoder la clé en base64 pour Fernet
            fernet_key = base64.urlsafe_b64encode(derived_key)
            self._cipher_suite = Fernet(fernet_key)

            logger.info("Encryption manager initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize encryption manager: {str(e)}")
            raise

    def encrypt(self, plaintext: str) -> Optional[str]:
        """
        Chiffre un texte brut.

        Args:
            plaintext: Texte à chiffrer

        Returns:
            Texte chiffré en base64, ou None si None ou vide
        """
        if plaintext is None or plaintext == "":
            return None

        try:
            ciphertext = self._cipher_suite.encrypt(plaintext.encode())
            # Retourner en base64 pour stockage dans DB
            return base64.urlsafe_b64encode(ciphertext).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            return None

    def decrypt(self, ciphertext_b64: str) -> Optional[str]:
        """
        Déchiffre un texte chiffré.

        Args:
            ciphertext_b64: Texte chiffré en base64

        Returns:
            Texte original, ou None si vide ou None

        Raises:
            InvalidToken: Si le token est invalide ou compromis
        """
        if ciphertext_b64 is None:
            return None

        if ciphertext_b64 == "":
            return None

        try:
            # Décoder depuis base64
            ciphertext = base64.urlsafe_b64decode(ciphertext_b64.encode())
            # Déchiffrer
            plaintext = self._cipher_suite.decrypt(ciphertext)
            return plaintext.decode()
        except (InvalidToken, ValueError, binascii.Error):
            logger.warning("Attempt to decrypt with invalid or tampered token")
            raise InvalidToken("Invalid ciphertext or corrupted data")
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            return None

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hache un mot de passe avec PBKDF2.

        Args:
            password: Mot de passe à hacher

        Returns:
            Hash base64 du mot de passe
        """
        if not password:
            return ""

        salt = b"nere_app_password_salt"
        try:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend(),
            )
            hash_bytes = kdf.derive(password.encode())
            return base64.urlsafe_b64encode(hash_bytes).decode()
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            return ""

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """
        Vérifie un mot de passe contre son hash.

        Args:
            password: Mot de passe à vérifier
            hashed: Hash du mot de passe

        Returns:
            True si le mot de passe correspond au hash
        """
        if not password or not hashed:
            return False

        try:
            new_hash = EncryptionManager.hash_password(password)
            return new_hash == hashed
        except Exception as e:
            logger.error(f"Password verification failed: {str(e)}")
            return False

    @staticmethod
    def hash_sensitive_data(data: str, salt: Optional[bytes] = None) -> str:
        """
        Hache une donnée sensible pour stockage (univoque, non réversible).

        Args:
            data: Donnée à hacher
            salt: Salt personnalisé (optionnel)

        Returns:
            Hash base64 de la donnée
        """
        if not data:
            return ""

        if salt is None:
            # Utiliser un salt par défaut
            salt = b"nere_app_hash_salt"

        try:
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend(),
            )
            hash_bytes = kdf.derive(data.encode())
            return base64.urlsafe_b64encode(hash_bytes).decode()
        except Exception as e:
            logger.error(f"Hashing failed: {str(e)}")
            return ""


# Instance globale du gestionnaire de chiffrement
_encryption_manager = None


def get_encryption_manager() -> EncryptionManager:
    """Obtient l'instance globale du gestionnaire de chiffrement."""
    global _encryption_manager
    if _encryption_manager is None:
        _encryption_manager = EncryptionManager()
    return _encryption_manager


# ============================================================================
# Utilitaires pour les headers de sécurité HTTPS/HSTS
# ============================================================================


def get_security_headers() -> dict:
    """
    Retourne les headers de sécurité pour HTTPS/HSTS.

    Returns:
        Dict des headers de sécurité
    """
    headers = {
        # HSTS: Forcer HTTPS pour 1 an
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
        # Prévenir le clickjacking
        "X-Frame-Options": "DENY",
        # Prévenir le MIME type sniffing
        "X-Content-Type-Options": "nosniff",
        # CSP: Content Security Policy
        "Content-Security-Policy": (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none';"
        ),
        # Prévenir le tracking entre sites
        "Referrer-Policy": "strict-origin-when-cross-origin",
        # Permissions Feature Policy
        "Permissions-Policy": (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        ),
    }

    # En production, forcer HTTPS
    if settings.ENVIRONMENT == "production":
        headers["X-Secure-Transport"] = "true"

    return headers


# ============================================================================
# Décorateur pour HTTPS enforcement
# ============================================================================

from functools import wraps
from fastapi import HTTPException, status, Request


def require_https(func):
    """
    Décorateur pour forcer HTTPS sur un endpoint.

    Rejette les connexions non-HTTPS en production.
    """

    @wraps(func)
    async def wrapper(*args, request: Request = None, **kwargs):
        # En production, forcer HTTPS
        if settings.ENVIRONMENT == "production":
            # Vérifier plusieurs indicateurs HTTPS
            is_https = (
                request.url.scheme == "https"
                or request.headers.get("X-Forwarded-Proto") == "https"
                or request.headers.get("X-Secure-Transport") == "true"
            )

            if not is_https:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="HTTPS required")

        return await func(*args, request=request, **kwargs)

    return wrapper
