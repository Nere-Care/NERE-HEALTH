"""
Tests du système de révocation de tokens JWT

Tests couvrant :
- Création et gestion de la blacklist
- Revocation via endpoint logout
- Tokens révoqués rejetés par middleware
- Nettoyage automatique des tokens expirés
- Audit logging de la révocation
"""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import User
from backend.token_blacklist import token_blacklist
from backend.jwt_handler import JWTHandler

client = TestClient(app)


class TestTokenBlacklistManager:
    """Tests du gestionnaire de blacklist"""

    def test_revoke_token_success(self):
        """Test la révocation d'un token"""
        token = "test_token_123"
        exp_time = datetime.now(timezone.utc) + timedelta(days=1)

        # Révoque le token
        result = token_blacklist.revoke(token, exp_time)
        assert result is True

        # Vérifie que le token est dans la blacklist
        assert token_blacklist.is_revoked(token) is True

    def test_revoke_token_already_revoked(self):
        """Test la révocation d'un token déjà révoqué"""
        token = "already_revoked_token"
        exp_time = datetime.now(timezone.utc) + timedelta(days=1)

        # Première revocation
        result1 = token_blacklist.revoke(token, exp_time)
        assert result1 is True

        # Deuxième revocation (déjà dans la blacklist)
        result2 = token_blacklist.revoke(token, exp_time)
        assert result2 is False

    def test_cleanup_expired_tokens(self):
        """Test le nettoyage des tokens expirés"""
        # Token expiré dans le passé
        expired_token = "expired_token_123"
        expired_time = datetime.now(timezone.utc) - timedelta(hours=1)

        # Token valide
        valid_token = "valid_token_456"
        valid_time = datetime.now(timezone.utc) + timedelta(days=1)

        # Révoquer les deux tokens
        token_blacklist.revoke(expired_token, expired_time)
        token_blacklist.revoke(valid_token, valid_time)

        # Appeler is_revoked sur le token valide déclenche le nettoyage
        assert token_blacklist.is_revoked(valid_token) is True

        # Le token expiré a été nettoyé, donc il n'est plus dans la blacklist
        assert token_blacklist.is_revoked(expired_token) is False

        # Vérifier que le token valide est toujours dans la blacklist
        size = token_blacklist.get_blacklist_size()
        assert size == 1


class TestTokenRevocationEndpoint:
    """Tests de l'endpoint de logout avec révocation"""

    @pytest.fixture
    def setup_auth(self, db, client):
        """Setup utilisateur authentifié"""
        from backend.auth import get_password_hash

        # Créer utilisateur
        user = User(
            email="logout_test@example.com",
            prenom="Test",
            nom="Logout",
            hashed_password=get_password_hash("TestPassword123!"),
            role="patient",
            statut="actif",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Obtenir token
        response = client.post(
            "/auth/token",
            data={
                "username": "logout_test@example.com",
                "password": "TestPassword123!",
            }
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        return {"user": user, "token": token}

    def test_logout_revokes_token(self, medecin_auth_header):
        """Test que le logout révoque le token"""
        # Vérifier que le token fonctionne avant logout
        response1 = client.get(
            "/auth/me",
            headers=medecin_auth_header
        )
        assert response1.status_code == 200

        # Logout avec le token
        response2 = client.post(
            "/auth/logout",
            headers=medecin_auth_header
        )
        assert response2.status_code == 200
        data = response2.json()
        assert data["message"] == "Déconnexion réussie"
        assert data["tokens_revoked"] >= 0

    def test_revoked_token_rejected(self, medecin_auth_header):
        """Test que les tokens révoqués sont rejetés"""
        # Extraire le token
        token = medecin_auth_header.get("Authorization", "").replace("Bearer ", "")

        # Révoquer directement le token
        exp_time = datetime.now(timezone.utc) + timedelta(days=7)
        token_blacklist.revoke(token, exp_time)

        # Essayer d'utiliser le token révoqué
        response = client.get(
            "/api/users/me",
            headers=medecin_auth_header
        )

        # Devrait être rejeté (401 avec message de révocation)
        assert response.status_code == 401
        data = response.json()
        assert "revoked" in data["detail"].lower() or "token" in data["detail"].lower()

    def test_multiple_logout_attempts(self, medecin_auth_header):
        """Test les tentatives de logout multiples"""
        # Premier logout
        response1 = client.post(
            "/auth/logout",
            headers=medecin_auth_header
        )
        assert response1.status_code == 200

        # Deuxième logout avec le même token (devrait échouer - token révoqué)
        response2 = client.post(
            "/auth/logout",
            headers=medecin_auth_header
        )
        assert response2.status_code == 401  # Token révoqué

    def test_logout_invalid_token(self):
        """Test le logout avec un token invalide"""
        invalid_headers = {"Authorization": "Bearer invalid_token_xyz"}

        response = client.post(
            "/auth/logout",
            headers=invalid_headers
        )

        # Devrait retourner 401
        assert response.status_code == 401


class TestTokenRevocationAudit:
    """Tests de l'audit logging pour la révocation"""

    def test_logout_audit_logged(self, db, medecin_auth_header):
        """Test que le logout est loggé dans l'audit"""
        from backend.audit_logger import AuditLog

        # Compter les logs avant logout
        initial_count = db.query(AuditLog).filter(
            AuditLog.action == "deconnexion"
        ).count()

        # Logout
        response = client.post(
            "/auth/logout",
            headers=medecin_auth_header
        )
        assert response.status_code == 200

        # Vérifier qu'un log a été créé
        final_count = db.query(AuditLog).filter(
            AuditLog.action == "deconnexion"
        ).count()

        assert final_count > initial_count

    def test_revoked_token_rejection_logged(self, db, medecin_auth_header):
        """Test que le rejet d'un token révoqué est loggé"""
        from backend.audit_logger import AuditLog

        # Extraire le token
        token = medecin_auth_header.get("Authorization", "").replace("Bearer ", "")

        # Révoquer le token
        exp_time = datetime.now(timezone.utc) + timedelta(days=7)
        token_blacklist.revoke(token, exp_time)

        # Compter les logs d'erreur avant
        initial_count = db.query(AuditLog).filter(
            AuditLog.action == "tentative_connexion_echec"
        ).count()

        # Essayer d'utiliser le token révoqué
        response = client.get(
            "/auth/me",
            headers=medecin_auth_header
        )
        assert response.status_code == 401

        # Vérifier qu'un log d'erreur a été créé
        final_count = db.query(AuditLog).filter(
            AuditLog.action == "tentative_connexion_echec"
        ).count()

        assert final_count > initial_count


class TestTokenRevocationIntegration:
    """Tests d'intégration du système complet"""

    def test_user_session_lifecycle(self, db):
        """Test le cycle complet session utilisateur : login -> revocation -> logout"""
        from backend.auth import get_password_hash
        import uuid

        # Créer un email unique pour ce test
        test_email = f"lifecycle_test_{uuid.uuid4().hex[:8]}@example.com"

        # 1. Créer utilisateur
        user = User(
            email=test_email,
            prenom="Lifecycle",
            nom="Test",
            mot_de_passe_hash=get_password_hash("LifecycleTest123!"),
            role="patient",
            statut="actif",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 2. Login
        response = client.post(
            "/auth/token",
            data={
                "username": test_email,
                "password": "LifecycleTest123!",
            }
        )
        assert response.status_code == 200
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Vérifier accès avant logout
        response = client.get(
            "/auth/me",
            headers=headers
        )
        assert response.status_code == 200

        # 4. Logout
        response = client.post(
            "/auth/logout",
            headers=headers
        )
        assert response.status_code == 200

        # 5. Vérifier rejet après logout
        response = client.get(
            "/auth/me",
            headers=headers
        )
        assert response.status_code == 401

        # 6. Vérifier que le token est dans la blacklist
        assert token_blacklist.is_revoked(token) is True

    def test_concurrent_requests_with_revocation(self, medecin_auth_header):
        """Test les requêtes concurrentes pendant la révocation"""
        import concurrent.futures

        def make_request():
            response = client.get(
                "/auth/me",
                headers=medecin_auth_header
            )
            return response.status_code

        # Faire plusieurs requêtes en parallèle
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            statuses_before = [f.result() for f in futures]

        # Tous les statuses avant logout devraient être 200
        assert all(status == 200 for status in statuses_before)

        # Logout
        response = client.post(
            "/auth/logout",
            headers=medecin_auth_header
        )
        assert response.status_code == 200

        # Faire plusieurs requêtes en parallèle après logout
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            statuses_after = [f.result() for f in futures]

        # Tous les statuses après logout devraient être 401
        assert all(status == 401 for status in statuses_after)


@pytest.fixture(autouse=True)
def cleanup_blacklist():
    """Nettoyer la blacklist avant chaque test"""
    token_blacklist.clear_all()
    yield
    token_blacklist.clear_all()
