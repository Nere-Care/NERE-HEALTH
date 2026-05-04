"""
Token Blacklist Manager - Gestion de la révocation de tokens JWT

Fournit un système de blacklist thread-safe pour révoquer les tokens
lors du logout ou d'autres événements de sécurité.

Fonctionnalités :
- Stockage des tokens révoqués en mémoire (peut être étendu à Redis en production)
- Nettoyage automatique des tokens expirés
- Vérification rapide d'un token avec O(1) lookup
"""

import logging
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Dict, Set
from uuid import UUID

logger = logging.getLogger(__name__)


class TokenBlacklist:
    """
    Gestionnaire de tokens révoqués.

    Utilise un Set pour O(1) lookup et un Dict pour tracker l'expiration.
    Nettoie automatiquement les tokens expirés.
    """

    def __init__(self):
        """Initialiser la blacklist vide avec verrous pour thread-safety"""
        self._blacklist: Set[str] = set()
        self._expiry: Dict[str, datetime] = {}
        self._lock = Lock()

    def revoke(self, token: str, exp_time: datetime) -> bool:
        """
        Ajouter un token à la blacklist.

        Args:
            token: Le JWT à révoquer
            exp_time: Datetime UTC d'expiration du token

        Returns:
            True si le token a été révoqué, False s'il était déjà révoqué
        """
        with self._lock:
            # Nettoyer les tokens expirés avant d'ajouter
            self._cleanup_expired()

            # Vérifier si déjà révoqué
            if token in self._blacklist:
                logger.debug(f"Token déjà révoqué")
                return False

            # Ajouter à la blacklist
            self._blacklist.add(token)
            self._expiry[token] = exp_time

            logger.info(f"✓ Token révoqué jusqu'à {exp_time.isoformat()}")
            return True

    def is_revoked(self, token: str) -> bool:
        """
        Vérifier si un token est révoqué.

        Effectue un nettoyage des tokens expirés avant de vérifier.

        Args:
            token: Le JWT à vérifier

        Returns:
            True si le token est révoqué, False sinon
        """
        with self._lock:
            # Nettoyer les tokens expirés
            self._cleanup_expired()

            # Vérifier si dans la blacklist
            return token in self._blacklist

    def _cleanup_expired(self) -> None:
        """
        Nettoyer les tokens expirés de la blacklist.

        Cette méthode doit être appelée à l'intérieur du verrou.
        """
        now = datetime.now(timezone.utc)
        expired_tokens = [
            token
            for token, exp_time in self._expiry.items()
            if exp_time < now
        ]

        for token in expired_tokens:
            self._blacklist.discard(token)
            del self._expiry[token]

        if expired_tokens:
            logger.debug(f"🧹 Nettoyé {len(expired_tokens)} tokens expirés")

    def get_blacklist_size(self) -> int:
        """Obtenir la taille actuelle de la blacklist (pour monitoring)"""
        with self._lock:
            self._cleanup_expired()
            return len(self._blacklist)

    def clear_all(self) -> None:
        """Effacer toute la blacklist (pour tests seulement)"""
        with self._lock:
            self._blacklist.clear()
            self._expiry.clear()
            logger.debug("🗑️  Blacklist complètement effacée")

    def revoke_all_for_user(self, user_id: UUID) -> int:
        """
        Révoquer tous les tokens d'un utilisateur (compromission).

        Note: Cette implémentation simple maintient juste la blacklist.
        Pour une vraie implémentation, il faudrait tracker les tokens par utilisateur.

        Args:
            user_id: L'ID de l'utilisateur

        Returns:
            Nombre de tokens révoqués
        """
        # Pour implémenter correctement, il faudrait :
        # 1. Encoder l'user_id dans le JWT (ce qui est déjà fait dans JWTHandler)
        # 2. Maintenir un index token -> user_id dans la blacklist
        # 3. Itérer sur les tokens d'un utilisateur

        # Pour maintenant, cette fonction reste un placeholder
        # Les tokens seront révoqués individuellement
        logger.info(f"Révocation de tous les tokens pour l'utilisateur {user_id}")
        return 0


# Instance globale singleton
token_blacklist = TokenBlacklist()
