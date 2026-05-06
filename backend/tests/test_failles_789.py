"""
Tests d'intégration pour FAILLEs #7, #8, #9
JWT Authentication, Data Encryption, Input Validation
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import jwt as pyjwt
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

# Ces imports supposent que main.py expose l'app FastAPI
# À adapter selon votre structure réelle


class TestFAILLE7JWTAuthentication:
    """Tests pour FAILLE #7: JWT Authentication avec rotation de token"""

    def test_jwt_handler_import(self):
        """Test que le module jwt_handler peut être importé"""
        try:
            from backend.jwt_handler import JWTHandler

            assert JWTHandler is not None
        except Exception as e:
            pytest.fail(f"Failed to import JWTHandler: {e}")

    def test_create_access_token(self):
        """Test création d'un token d'accès"""
        from backend.jwt_handler import JWTHandler
        from backend.config import _get_settings_instance

        user_data = {"sub": "user123", "email": "test@example.com", "role": "doctor"}

        token = JWTHandler.create_access_token(user_data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

        # Vérifier que le token peut être décodé
        decoded = pyjwt.decode(token, _get_settings_instance().SECRET_KEY, algorithms=["HS256"])
        assert decoded["sub"] == "user123"
        assert decoded["type"] == "access"

    def test_create_refresh_token(self):
        """Test création d'un refresh token"""
        from backend.jwt_handler import JWTHandler
        from backend.config import _get_settings_instance

        user_data = {"sub": "user123", "email": "test@example.com"}

        token = JWTHandler.create_refresh_token(user_data)

        assert token is not None
        assert isinstance(token, str)

        # Vérifier que le token peut être décodé
        decoded = pyjwt.decode(token, _get_settings_instance().SECRET_KEY, algorithms=["HS256"])
        assert decoded["sub"] == "user123"
        assert decoded["type"] == "refresh"

    def test_decode_valid_token(self):
        """Test décodage d'un token valide"""
        from backend.jwt_handler import JWTHandler

        user_data = {"sub": "user123", "email": "test@example.com", "role": "doctor"}

        token = JWTHandler.create_access_token(user_data)
        decoded = JWTHandler.decode_token(token)

        assert decoded is not None
        assert decoded["sub"] == "user123"
        assert decoded["email"] == "test@example.com"

    def test_decode_expired_token(self):
        """Test que les tokens expirés sont rejetés"""
        from backend.jwt_handler import JWTHandler
        from backend.config import _get_settings_instance
        from datetime import timezone

        # Créer un token expiré
        now = datetime.now(timezone.utc)
        payload = {
            "sub": "user123",
            "email": "test@example.com",
            "type": "access",
            "exp": int((now - timedelta(hours=1)).timestamp()),  # Expiré il y a 1 heure
            "iat": int((now - timedelta(hours=2)).timestamp()),
        }

        expired_token = pyjwt.encode(payload, _get_settings_instance().SECRET_KEY, algorithm="HS256")

        # Tentative de décodage devrait échouer
        try:
            decoded = JWTHandler.decode_token(expired_token)
            assert False, "Expected InvalidTokenError"
        except pyjwt.InvalidTokenError:
            pass  # Expected behavior

    def test_token_rotation(self):
        """Test rotation de token proactive"""
        from backend.jwt_handler import JWTHandler

        user_data = {"sub": "user123", "email": "test@example.com", "role": "doctor"}

        # Créer un token avec peu de temps restant
        token = JWTHandler.create_access_token(user_data)

        # Vérifier si rotation est nécessaire
        should_rotate = JWTHandler.should_rotate_token(token)

        # Pour un nouveau token, ne devrait pas besoin de rotation
        # (mais le contrôle devrait être présent)
        assert isinstance(should_rotate, bool)

    def test_token_blacklist_structure(self):
        """Test structure du TokenBlacklist model"""
        try:
            from backend.models import TokenBlacklist

            # Vérifier les attributs clés
            assert hasattr(TokenBlacklist, "id")
            assert hasattr(TokenBlacklist, "token")
            assert hasattr(TokenBlacklist, "user_id")
            assert hasattr(TokenBlacklist, "reason")
            assert hasattr(TokenBlacklist, "expires_at")
        except Exception as e:
            pytest.fail(f"TokenBlacklist model validation failed: {e}")

    def test_token_rotation_log_structure(self):
        """Test structure du TokenRotationLog model"""
        try:
            from backend.models import TokenRotationLog

            # Vérifier les attributs clés
            assert hasattr(TokenRotationLog, "id")
            assert hasattr(TokenRotationLog, "user_id")
            assert hasattr(TokenRotationLog, "old_token_hash")
            assert hasattr(TokenRotationLog, "new_token_hash")
            assert hasattr(TokenRotationLog, "rotation_reason")
        except Exception as e:
            pytest.fail(f"TokenRotationLog model validation failed: {e}")


class TestFAILLE8DataEncryption:
    """Tests pour FAILLE #8: Data Encryption"""

    def test_encryption_manager_import(self):
        """Test que le module encryption peut être importé"""
        try:
            from backend.encryption import EncryptionManager

            assert EncryptionManager is not None
        except Exception as e:
            pytest.fail(f"Failed to import EncryptionManager: {e}")

    def test_encrypt_decrypt_string(self):
        """Test chiffrement et déchiffrement bidirectionnel"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        original_text = "Données médicales sensibles"

        # Chiffrer
        encrypted = manager.encrypt(original_text)
        assert encrypted is not None
        assert encrypted != original_text  # Doit être chiffré

        # Déchiffrer
        decrypted = manager.decrypt(encrypted)
        assert decrypted == original_text

    def test_encrypt_empty_string(self):
        """Test chiffrement d'une chaîne vide"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        encrypted = manager.encrypt("")

        if encrypted is not None:
            decrypted = manager.decrypt(encrypted)
            assert decrypted == ""
        else:
            # Empty string encryption returns None
            assert encrypted is None

    def test_encrypt_special_characters(self):
        """Test chiffrement avec caractères spéciaux"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        special_text = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`"

        encrypted = manager.encrypt(special_text)
        decrypted = manager.decrypt(encrypted)

        assert decrypted == special_text

    def test_encrypt_unicode(self):
        """Test chiffrement avec caractères Unicode"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        unicode_text = "你好世界 مرحبا بالعالم Привет мир"

        encrypted = manager.encrypt(unicode_text)

        # Déchiffrer le texte chiffré
        decrypted_encrypted = manager.decrypt(encrypted)
        assert decrypted_encrypted == unicode_text

    def test_password_hash_verify(self):
        """Test hachage et vérification de mot de passe"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        password = "SecurePassword123!"

        # Hacher
        hashed = manager.hash_password(password)
        assert hashed is not None
        assert hashed != password

        # Vérifier
        is_valid = manager.verify_password(password, hashed)
        assert is_valid is True

        # Faux mot de passe
        is_invalid = manager.verify_password("WrongPassword", hashed)
        assert is_invalid is False

    def test_different_encryptions_produce_different_results(self):
        """Test que les chiffrements du même texte produisent des résultats différents (IV aléatoire)"""
        from backend.encryption import EncryptionManager

        manager = EncryptionManager()
        text = "Same text to encrypt"

        encrypted1 = manager.encrypt(text)
        encrypted2 = manager.encrypt(text)

        # Les chiffrements doivent être différents (IV aléatoire)
        assert encrypted1 != encrypted2

        # Mais les deux doivent déchiffrer au même texte
        assert manager.decrypt(encrypted1) == text
        assert manager.decrypt(encrypted2) == text

    def test_security_headers(self):
        """Test que les headers de sécurité sont configurés"""
        from backend.encryption import get_security_headers

        headers = get_security_headers()

        assert "Strict-Transport-Security" in headers
        assert "Content-Security-Policy" in headers
        assert "X-Frame-Options" in headers
        assert "X-Content-Type-Options" in headers

    def test_https_middleware_import(self):
        """Test que le middleware HTTPS peut être importé"""
        try:
            from backend.https_middleware import HTTPSEnforcementMiddleware

            assert HTTPSEnforcementMiddleware is not None
        except Exception as e:
            pytest.fail(f"Failed to import HTTPSEnforcementMiddleware: {e}")


class TestFAILLE9InputValidation:
    """Tests pour FAILLE #9: Input Validation"""

    def test_input_validator_import(self):
        """Test que le module input_validator peut être importé"""
        try:
            from backend.input_validator import InputValidator

            assert InputValidator is not None
        except Exception as e:
            pytest.fail(f"Failed to import InputValidator: {e}")

    def test_sanitize_text_html_escape(self):
        """Test HTML escaping"""
        from backend.input_validator import InputValidator

        validator = InputValidator()
        malicious_input = "<script>alert('XSS')</script>"
        sanitized = validator.sanitize_text(malicious_input)

        assert "<script>" not in sanitized
        assert "alert" in sanitized

    def test_sanitize_text_length_limit(self):
        """Test limite de longueur"""
        from backend.input_validator import InputValidator

        validator = InputValidator()
        long_text = "a" * 10000  # Très long
        sanitized = validator.sanitize_text(long_text, max_length=100)

        assert len(sanitized) <= 100

    def test_check_sql_injection(self):
        """Test détection d'injection SQL"""
        from backend.input_validator import InputValidator

        validator = InputValidator()

        # Tests SQL injection
        sql_injections = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1 UNION SELECT * FROM users",
            "1'; DELETE FROM users WHERE '1'='1",
        ]

        for injection in sql_injections:
            is_detected = validator.check_sql_injection(injection)
            assert is_detected is True, f"Failed to detect: {injection}"

    def test_check_xss_script_tag(self):
        """Test détection d'attaques XSS"""
        from backend.input_validator import InputValidator

        validator = InputValidator()

        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<iframe src='malicious.js'></iframe>",
            "<img src=x onerror=alert('XSS')>",
            "<body onload=alert('XSS')>",
        ]

        for payload in xss_payloads:
            is_detected = validator.check_xss(payload)
            assert is_detected is True, f"Failed to detect XSS: {payload}"

    def test_validate_email(self):
        """Test validation email"""
        from backend.input_validator import InputValidator

        validator = InputValidator()

        # Emails valides
        valid_emails = [
            "user@example.com",
            "test.user@example.co.uk",
            "user+tag@example.com",
        ]

        for email in valid_emails:
            assert validator.validate_email(email) is True, f"Valid email rejected: {email}"

        # Emails invalides
        invalid_emails = [
            "invalid.email",
            "@example.com",
            "user@",
            "user @example.com",
        ]

        for email in invalid_emails:
            assert validator.validate_email(email) is False, f"Invalid email accepted: {email}"

    def test_validate_phone(self):
        """Test validation numéro de téléphone"""
        from backend.input_validator import InputValidator

        validator = InputValidator()

        # Numéros valides (format international)
        valid_phones = [
            "+1234567890",
            "+33612345678",
            "+33 6 12 34 56 78",
        ]

        for phone in valid_phones:
            assert validator.validate_phone(phone) is True, f"Valid phone rejected: {phone}"

    def test_validate_url(self):
        """Test validation URL"""
        from backend.input_validator import InputValidator

        validator = InputValidator()

        # URLs valides
        valid_urls = [
            "https://example.com",
            "https://example.com/path",
            "https://sub.example.com/path?query=value",
        ]

        for url in valid_urls:
            assert validator.validate_url(url) is True, f"Valid URL rejected: {url}"

        # URLs invalides
        invalid_urls = [
            "http://example.com",  # HTTP non HTTPS
            "ftp://example.com",
            "example.com",  # Sans protocole
        ]

        for url in invalid_urls:
            assert validator.validate_url(url) is False, f"Invalid URL accepted: {url}"

    def test_validate_file_upload(self):
        """Test validation fichier upload"""
        from backend.input_validator import InputValidator
        from unittest.mock import Mock

        validator = InputValidator()

        # Fichier valide
        valid_file = Mock()
        valid_file.filename = "document.pdf"
        valid_file.content_type = "application/pdf"
        valid_file.size = 5 * 1024 * 1024  # 5MB

        is_valid = validator.validate_file_upload(valid_file)
        assert is_valid is True

    def test_pydantic_validation_schemas(self):
        """Test que les schemas Pydantic valident correctement"""
        try:
            from backend.schemas import UserCreate, ConsultationCreate

            # Test UserRegisterSchema
            valid_user = UserCreate(email="test@example.com", password="SecurePass123!", prenom="John", nom="Doe")
            assert valid_user.email == "test@example.com"

            # Invalid email should fail
            with pytest.raises(Exception):
                UserCreate(email="invalid-email", password="SecurePass123!", prenom="John", nom="Doe")
        except Exception as e:
            pytest.fail(f"Pydantic schemas validation failed: {e}")


class TestIntegrationFAILLES789:
    """Tests d'intégration combinés FAILLEs #7, #8, #9"""

    def test_all_modules_can_be_imported_together(self):
        """Test que tous les modules peuvent être importés ensemble"""
        try:
            from backend.jwt_handler import JWTHandler
            from backend.encryption import EncryptionManager
            from backend.input_validator import InputValidator

            assert JWTHandler is not None
            assert EncryptionManager is not None
            assert InputValidator is not None
        except Exception as e:
            pytest.fail(f"Failed to import all modules together: {e}")

    def test_secure_workflow_simulation(self):
        """Simulation d'un workflow sécurisé complet"""
        from backend.jwt_handler import JWTHandler
        from backend.encryption import EncryptionManager
        from backend.input_validator import InputValidator

        # 1. Validation de l'entrée utilisateur
        validator = InputValidator()
        user_email = "doctor@hospital.com"
        assert validator.validate_email(user_email)

        # 2. Création de tokens JWT
        jwt_handler = JWTHandler()
        tokens = {
            "access": jwt_handler.create_access_token({"sub": "user123", "email": user_email, "role": "doctor"}),
            "refresh": jwt_handler.create_refresh_token({"sub": "user123", "email": user_email}),
        }
        assert tokens["access"] is not None
        assert tokens["refresh"] is not None

        # 3. Chiffrement des données sensibles
        manager = EncryptionManager()
        sensitive_data = "Patient SSN: 123-45-6789"
        encrypted_data = manager.encrypt(sensitive_data)
        decrypted_data = manager.decrypt(encrypted_data)
        assert decrypted_data == sensitive_data


# ============================================================
# EXÉCUTION DES TESTS
# ============================================================

if __name__ == "__main__":
    print("SUITE DE TESTS - FAILLEs #7, #8, #9")
    pytest.main([__file__, "-v", "--tb=short", "-s"])
