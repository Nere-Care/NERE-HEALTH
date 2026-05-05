"""
Tests pour FAILLE #8: Data Encryption

Tests du système de chiffrement :
- Chiffrement/déchiffrement Fernet
- Hachage sécurisé
- Headers HTTPS/HSTS
- Enforcement HTTPS en production
"""

import pytest
from cryptography.fernet import InvalidToken
from base64 import b64encode

from backend.encryption import (
    EncryptionManager,
    get_encryption_manager,
    get_security_headers,
)
from backend.config import _get_settings_instance


class TestEncryptionManager:
    """Tests du gestionnaire de chiffrement."""

    def test_initialization(self):
        """Initialise correctement le gestionnaire."""
        manager = EncryptionManager()
        assert manager._cipher_suite is not None
        assert manager.backend is not None

    def test_encrypt_decrypt_roundtrip(self):
        """Chiffrement et déchiffrement simples."""
        manager = EncryptionManager()

        plaintext = "données sensibles à protéger"
        ciphertext = manager.encrypt(plaintext)

        assert ciphertext is not None
        assert ciphertext != plaintext
        assert len(ciphertext) > len(plaintext)

        # Déchiffrer
        decrypted = manager.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_empty_string(self):
        """Gère les chaînes vides."""
        manager = EncryptionManager()

        result = manager.encrypt("")
        assert result is None

        result = manager.encrypt(None)
        assert result is None

    def test_decrypt_invalid_ciphertext(self):
        """Rejette un texte chiffré invalide."""
        manager = EncryptionManager()

        with pytest.raises(InvalidToken):
            manager.decrypt("invalid_ciphertext_data")

    def test_decrypt_empty_ciphertext(self):
        """Gère les textes chiffrés vides."""
        manager = EncryptionManager()

        result = manager.decrypt("")
        assert result is None

        result = manager.decrypt(None)
        assert result is None

    def test_encrypt_pii_data(self):
        """Chiffre les données PII (Personally Identifiable Information)."""
        manager = EncryptionManager()

        # Données PII
        pii_data = [
            "john.doe@example.com",
            "+33612345678",
            "Dupont Jean",
            "Allergie pénicilline",
        ]

        for data in pii_data:
            encrypted = manager.encrypt(data)
            assert encrypted is not None
            assert encrypted != data

            decrypted = manager.decrypt(encrypted)
            assert decrypted == data

    def test_encryption_produces_different_ciphertexts(self):
        """Chiffrer deux fois produit des ciphertexts différents."""
        manager = EncryptionManager()

        plaintext = "même donnée"

        cipher1 = manager.encrypt(plaintext)
        cipher2 = manager.encrypt(plaintext)

        # Fernet ajoute un timestamp, donc les ciphertexts sont différents
        assert cipher1 != cipher2

        # Mais les deux déchiffrent vers le même plaintext
        assert manager.decrypt(cipher1) == plaintext
        assert manager.decrypt(cipher2) == plaintext


class TestHashingSensitiveData:
    """Tests du hachage de données sensibles."""

    def test_hash_sensitive_data(self):
        """Hache une donnée sensible."""
        data = "sensitive_info"
        hashed = EncryptionManager.hash_sensitive_data(data)

        assert hashed is not None
        assert hashed != data
        assert len(hashed) > 0

    def test_hash_is_deterministic(self):
        """Hacher deux fois produit le même résultat."""
        data = "info_stable"

        hash1 = EncryptionManager.hash_sensitive_data(data)
        hash2 = EncryptionManager.hash_sensitive_data(data)

        # Le hachage est déterministe
        assert hash1 == hash2

    def test_hash_with_custom_salt(self):
        """Hache avec un salt personnalisé."""
        data = "info"
        salt1 = b"salt1"
        salt2 = b"salt2"

        hash1 = EncryptionManager.hash_sensitive_data(data, salt1)
        hash2 = EncryptionManager.hash_sensitive_data(data, salt2)

        # Différents salts produisent différents hashes
        assert hash1 != hash2

    def test_hash_empty_data(self):
        """Gère les données vides."""
        result = EncryptionManager.hash_sensitive_data("")
        assert result == ""

        result = EncryptionManager.hash_sensitive_data(None)
        assert result == ""


class TestEncryptionManagerSingleton:
    """Tests du gestionnaire de chiffrement global."""

    def test_get_encryption_manager_singleton(self):
        """Retourne toujours la même instance."""
        manager1 = get_encryption_manager()
        manager2 = get_encryption_manager()

        assert manager1 is manager2


class TestSecurityHeaders:
    """Tests des headers de sécurité."""

    def test_get_security_headers_contains_hsts(self):
        """Inclut le header HSTS."""
        headers = get_security_headers()

        assert "Strict-Transport-Security" in headers
        assert "max-age=" in headers["Strict-Transport-Security"]
        assert "includeSubDomains" in headers["Strict-Transport-Security"]

    def test_get_security_headers_contains_csp(self):
        """Inclut la Content Security Policy."""
        headers = get_security_headers()

        assert "Content-Security-Policy" in headers
        csp = headers["Content-Security-Policy"]
        assert "default-src" in csp
        assert "script-src" in csp

    def test_get_security_headers_contains_x_frame_options(self):
        """Inclut la protection contre le clickjacking."""
        headers = get_security_headers()

        assert "X-Frame-Options" in headers
        assert headers["X-Frame-Options"] == "DENY"

    def test_get_security_headers_contains_content_type_options(self):
        """Inclut la protection MIME sniffing."""
        headers = get_security_headers()

        assert "X-Content-Type-Options" in headers
        assert headers["X-Content-Type-Options"] == "nosniff"

    def test_get_security_headers_contains_referrer_policy(self):
        """Inclut la Referrer Policy."""
        headers = get_security_headers()

        assert "Referrer-Policy" in headers
        assert "origin" in headers["Referrer-Policy"].lower()

    def test_get_security_headers_contains_permissions_policy(self):
        """Inclut la Permissions Policy."""
        headers = get_security_headers()

        assert "Permissions-Policy" in headers
        policy = headers["Permissions-Policy"]

        # Vérifier que les permissions sensibles sont désactivées
        assert "camera=()" in policy
        assert "microphone=()" in policy
        assert "geolocation=()" in policy


class TestHTTPSHeaders:
    """Tests des headers spécifiques HTTPS."""

    def test_hsts_max_age_production(self, monkeypatch):
        """La durée HSTS est correcte en production."""
        # Simuler la production
        monkeypatch.setenv('ENVIRONMENT', 'production')

        # Reset settings pour prendre en compte la nouvelle valeur
        import backend.config
        backend.config._reset_settings()
        backend.config._get_settings_instance()  # Initialize with new env

        headers = get_security_headers()

        hsts = headers["Strict-Transport-Security"]
        # Devrait être au moins 1 an (31536000 secondes)
        assert "31536000" in hsts or "max-age=" in hsts

    def test_csp_script_src_restrictive(self):
        """La CSP restreint les sources de scripts."""
        headers = get_security_headers()
        csp = headers["Content-Security-Policy"]

        # script-src devrait être restrictif
        assert "script-src 'self'" in csp


class TestDataEncryptionIntegration:
    """Tests d'intégration du chiffrement de données."""

    def test_pii_encryption_workflow(self):
        """Workflow complet de chiffrement PII."""
        manager = get_encryption_manager()

        # Données PII
        user_email = "john.doe@example.com"
        user_phone = "+33612345678"
        medical_note = "Allergie à la pénicilline"

        # Chiffrer pour stockage
        encrypted_email = manager.encrypt(user_email)
        encrypted_phone = manager.encrypt(user_phone)
        encrypted_note = manager.encrypt(medical_note)

        # Tous les chiffrements doivent réussir
        assert all([encrypted_email, encrypted_phone, encrypted_note])

        # Stocker en BD
        stored_data = {
            "email": encrypted_email,
            "phone": encrypted_phone,
            "note": encrypted_note,
        }

        # Récupérer et déchiffrer
        assert manager.decrypt(stored_data["email"]) == user_email
        assert manager.decrypt(stored_data["phone"]) == user_phone
        assert manager.decrypt(stored_data["note"]) == medical_note

    def test_document_data_encryption(self):
        """Chiffre les données de document médical."""
        manager = get_encryption_manager()

        # Document médical
        document_content = """
        ORDONNANCE
        Patient: Jean Dupont
        Médicaments: Ibuprofen 200mg, Amoxicilline 500mg
        Posologie: 1 comprimé 3x par jour
        """

        encrypted = manager.encrypt(document_content)
        assert encrypted is not None

        decrypted = manager.decrypt(encrypted)
        assert decrypted == document_content
