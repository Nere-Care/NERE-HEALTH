"""
Tests pour FAILLE #7: JWT Authentication & Token Rotation

Tests complets du système JWT avec:
- Création de tokens (access + refresh)
- Validation et expiration
- Rotation automatique
- Blacklist de tokens révoqués
- Audit logging
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch, MagicMock
from uuid import uuid4
import jwt

# Note: Ces tests supposent PyJWT 2.10.1 installé


class TestJWTTokenCreation:
    """Tests de création de tokens JWT."""

    def test_create_access_token(self):
        """Crée un access token valide."""
        from backend.jwt_handler import JWTHandler

        user_id = uuid4()
        email = "test@example.com"
        role = "patient"

        token = JWTHandler.create_access_token(user_id, email, role)

        # Vérifier que le token est une chaîne
        assert isinstance(token, str)
        assert len(token) > 0

        # Décoder et vérifier le payload
        payload = JWTHandler.decode_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["email"] == email
        assert payload["role"] == role
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        """Crée un refresh token valide."""
        from backend.jwt_handler import JWTHandler

        user_id = uuid4()
        email = "test@example.com"

        token = JWTHandler.create_refresh_token(user_id, email)

        # Vérifier le token
        assert isinstance(token, str)
        assert len(token) > 0

        # Décoder et vérifier
        payload = JWTHandler.decode_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["email"] == email
        assert payload["type"] == "refresh"

    def test_token_expiration_access_vs_refresh(self):
        """Vérifie que refresh token a une durée plus longue."""
        from backend.jwt_handler import JWTHandler
        from datetime import timedelta

        user_id = uuid4()

        # Créer les deux tokens
        access_token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")
        refresh_token = JWTHandler.create_refresh_token(user_id, "test@example.com")

        # Décoder
        access_payload = JWTHandler.decode_token(access_token)
        refresh_payload = JWTHandler.decode_token(refresh_token)

        # Calculer les durées
        access_lifetime = access_payload["exp"] - access_payload["iat"]
        refresh_lifetime = refresh_payload["exp"] - refresh_payload["iat"]

        # Refresh doit être plus long
        assert refresh_lifetime > access_lifetime
        # Refresh devrait être ~7 jours
        assert refresh_lifetime > 6 * 24 * 60 * 60  # > 6 jours


class TestJWTTokenValidation:
    """Tests de validation et décoding de tokens."""

    def test_decode_valid_token(self):
        """Décode un token valide."""
        from backend.jwt_handler import JWTHandler

        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "medecin")

        payload = JWTHandler.decode_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["email"] == "test@example.com"
        assert payload["role"] == "medecin"

    def test_decode_invalid_token(self):
        """Rejette un token invalide."""
        from backend.jwt_handler import JWTHandler

        invalid_token = "invalid.token.here"

        with pytest.raises(jwt.InvalidTokenError):
            JWTHandler.decode_token(invalid_token)

    def test_decode_expired_token(self):
        """Rejette un token expiré."""
        from backend.jwt_handler import JWTHandler
        from backend.config import _get_settings_instance
        from datetime import datetime, timedelta, timezone

        user_id = uuid4()
        # Créer un token expiré (il y a 1 heure)
        expire = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {
            "sub": str(user_id),
            "email": "test@example.com",
            "role": "patient",
            "type": "access",
            "exp": int(expire.timestamp()),
            "iat": int((expire - timedelta(minutes=15)).timestamp()),
        }

        expired_token = jwt.encode(
            payload,
            _get_settings_instance().SECRET_KEY,
            algorithm="HS256",
        )

        # Devrait lever une exception
        with pytest.raises(jwt.InvalidTokenError):
            JWTHandler.decode_token(expired_token)


class TestJWTTokenRotation:
    """Tests de rotation de tokens."""

    def test_should_rotate_token_false(self):
        """Retourne False pour un token récent."""
        from backend.jwt_handler import JWTHandler

        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")

        # Token frais ne devrait pas être roté
        should_rotate = JWTHandler.should_rotate_token(token)
        assert should_rotate is False

    def test_should_rotate_token_true(self):
        """Retourne True pour un token approchant l'expiration."""
        from backend.jwt_handler import JWTHandler
        from backend.config import _get_settings_instance
        from datetime import datetime, timedelta, timezone

        user_id = uuid4()
        # Créer un token avec expiration dans 2 minutes (presque expiré)
        now = int(datetime.now(timezone.utc).timestamp())
        expire_soon = now + 120  # 2 minutes

        payload = {
            "sub": str(user_id),
            "email": "test@example.com",
            "role": "patient",
            "type": "access",
            "exp": expire_soon,
            "iat": now - 13 * 60,  # Créé il y a 13 minutes
        }

        token = jwt.encode(
            payload,
            _get_settings_instance().SECRET_KEY,
            algorithm="HS256",
        )

        # Devrait recommander la rotation
        should_rotate = JWTHandler.should_rotate_token(token)
        assert should_rotate is True


class TestJWTBlacklist:
    """Tests de blacklist de tokens."""

    @patch("backend.jwt_handler.Session")
    def test_is_token_blacklisted_false(self, mock_session):
        """Retourne False pour un token non blacklisté."""
        from backend.jwt_handler import JWTHandler

        mock_query = MagicMock()
        mock_query.filter().first.return_value = None
        mock_session.query.return_value = mock_query

        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")

        # Configurer le mock
        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        is_blacklisted = JWTHandler.is_token_blacklisted(db, token)
        assert is_blacklisted is False

    @patch("backend.jwt_handler.TokenBlacklist")
    def test_blacklist_token(self, mock_blacklist_class):
        """Ajoute un token à la blacklist."""
        from backend.jwt_handler import JWTHandler

        db = MagicMock()
        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")

        # Blacklister le token
        JWTHandler.blacklist_token(db, token, user_id, reason="logout")

        # Vérifier que db.add a été appelé
        assert db.add.called
        assert db.commit.called


class TestJWTAuthentication:
    """Tests d'authentification JWT complète."""

    @patch("backend.jwt_handler.Session")
    @patch("backend.jwt_handler.User")
    def test_validate_token_and_get_user_valid(self, mock_user_class, mock_session):
        """Valide un token et retourne l'utilisateur."""
        from backend.jwt_handler import JWTHandler

        db = MagicMock()
        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")

        # Configurer le mock pour l'utilisateur
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.is_active = True
        db.query.return_value.filter.return_value.first.side_effect = [None, mock_user]

        # Valider
        payload, error = JWTHandler.validate_token_and_get_user(db, token, "access")

        assert error is None
        assert payload is not None
        assert payload["type"] == "access"

    @patch("backend.jwt_handler.Session")
    def test_validate_token_blacklisted(self, mock_session):
        """Rejette un token blacklisté."""
        from backend.jwt_handler import JWTHandler

        db = MagicMock()
        user_id = uuid4()
        token = JWTHandler.create_access_token(user_id, "test@example.com", "patient")

        # Configurer pour que le token soit blacklisté
        db.query.return_value.filter.return_value.first.return_value = MagicMock()

        payload, error = JWTHandler.validate_token_and_get_user(db, token, "access")

        assert error is not None
        assert "révoqué" in error.lower()
        assert payload is None


class TestJWTCleanup:
    """Tests de nettoyage de la blacklist."""

    @patch("backend.jwt_handler.Session")
    def test_cleanup_expired_blacklist(self, mock_session):
        """Nettoie les entrées expirées de la blacklist."""
        from backend.jwt_handler import JWTHandler

        db = MagicMock()

        # Mock du query pour retourner un nombre de suppressions
        mock_query = MagicMock()
        mock_query.filter.return_value.delete.return_value = 5
        db.query.return_value = mock_query

        # Nettoyer
        deleted_count = JWTHandler.cleanup_expired_blacklist(db)

        # Vérifier
        assert deleted_count == 5
        assert db.commit.called


class TestJWTAuthRoutes:
    """Tests des routes d'authentification JWT."""

    def test_login_endpoint_creates_tokens(self):
        """L'endpoint /auth/token crée une paire de tokens."""
        # Ce test nécessiterait un client FastAPI et une DB en mémoire
        # À implémenter avec une vraie BD de test
        pass

    def test_refresh_endpoint_rotates_tokens(self):
        """L'endpoint /auth/refresh rafraîchit les tokens."""
        # Ce test nécessiterait un client FastAPI et une DB en mémoire
        pass

    def test_logout_endpoint_revokes_tokens(self):
        """L'endpoint /auth/logout révoque les tokens."""
        # Ce test nécessiterait un client FastAPI et une DB en mémoire
        pass


# ============================================================================
# Tests d'intégration
# ============================================================================


class TestJWTIntegration:
    """Tests d'intégration complets du système JWT."""

    def test_complete_jwt_lifecycle(self):
        """Test le cycle de vie complet d'un token JWT."""
        from backend.jwt_handler import JWTHandler

        user_id = uuid4()
        email = "user@example.com"
        role = "medecin"

        # 1. Créer les tokens
        access_token = JWTHandler.create_access_token(user_id, email, role)
        refresh_token = JWTHandler.create_refresh_token(user_id, email)

        assert access_token is not None
        assert refresh_token is not None

        # 2. Valider les tokens
        access_payload = JWTHandler.decode_token(access_token)
        refresh_payload = JWTHandler.decode_token(refresh_token)

        assert access_payload["type"] == "access"
        assert refresh_payload["type"] == "refresh"

        # 3. Vérifier que les types de tokens sont corrects
        assert access_payload["role"] == role
        assert refresh_payload["sub"] == str(user_id)

        # 4. Vérifier l'expiration
        assert access_payload["exp"] > access_payload["iat"]
        assert refresh_payload["exp"] > refresh_payload["iat"]

    def test_token_not_rotatable_when_fresh(self):
        """Un token frais ne doit pas être roté."""
        from backend.jwt_handler import JWTHandler

        token = JWTHandler.create_access_token(uuid4(), "test@example.com", "patient")

        # Token frais ne devrait pas être roté
        should_rotate = JWTHandler.should_rotate_token(token)
        assert should_rotate is False


# ============================================================================
# Fixtures pour tests
# ============================================================================


@pytest.fixture
def sample_user_id():
    """Retourne un UUID d'utilisateur de test."""
    return uuid4()


@pytest.fixture
def sample_access_token(sample_user_id):
    """Retourne un access token de test."""
    from backend.jwt_handler import JWTHandler

    return JWTHandler.create_access_token(sample_user_id, "test@example.com", "patient")


@pytest.fixture
def sample_refresh_token(sample_user_id):
    """Retourne un refresh token de test."""
    from backend.jwt_handler import JWTHandler

    return JWTHandler.create_refresh_token(sample_user_id, "test@example.com")
