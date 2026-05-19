"""
🔐 TESTS DE SÉCURITÉ - Configuration et Secrets
Vérifie que les secrets codés en dur lèvent des exceptions en production
"""

import pytest


def test_secret_key_not_default_in_production(monkeypatch):
    """FAILLE #1: SECRET_KEY='change-me' ne doit pas être acceptée en production"""
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "change-me")
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com")
    monkeypatch.setenv("ALLOWED_HOSTS", "example.com")
    monkeypatch.setenv("STRIPE_API_KEY", "sk_live_XXXXX")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_XXXXX")

    import sys

    if "backend.config" in sys.modules:
        del sys.modules["backend.config"]

    # Reset global instance
    import backend.config

    backend.config._reset_settings()

    from backend.config import Settings

    with pytest.raises(ValueError, match="SECRET_KEY"):
        Settings()


def test_secret_key_too_short_in_production(monkeypatch):
    """FAILLE #1: SECRET_KEY doit faire au minimum 64 caractères"""
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "short-key-12345")
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:securepass@localhost/db")
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com")
    monkeypatch.setenv("ALLOWED_HOSTS", "example.com")
    monkeypatch.setenv("STRIPE_API_KEY", "sk_live_XXXXX")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_XXXXX")

    import sys

    if "backend.config" in sys.modules:
        del sys.modules["backend.config"]

    # Reset global instance
    import backend.config

    backend.config._reset_settings()

    from backend.config import Settings

    with pytest.raises(ValueError, match="64 caractères"):
        Settings()


def test_cors_wildcard_forbidden_in_production(monkeypatch):
    """FAILLE #2: CORS_ORIGINS=* interdit en production"""
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "a" * 64)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:securepass@localhost/db")
    monkeypatch.setenv("CORS_ORIGINS", "*")
    monkeypatch.setenv("ALLOWED_HOSTS", "example.com")
    monkeypatch.setenv("STRIPE_API_KEY", "sk_live_XXXXX")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_XXXXX")

    import sys

    if "backend.config" in sys.modules:
        del sys.modules["backend.config"]

    # Reset global instance
    import backend.config

    backend.config._reset_settings()

    from backend.config import Settings

    with pytest.raises(ValueError, match=r"CORS_ORIGINS=\* est interdite"):
        Settings()


def test_allowed_hosts_required_in_production(monkeypatch):
    """FAILLE #2: ALLOWED_HOSTS obligatoire en production"""
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "a" * 64)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:securepass@localhost/db")
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com")
    monkeypatch.setenv("ALLOWED_HOSTS", "")
    monkeypatch.setenv("STRIPE_API_KEY", "sk_live_XXXXX")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_XXXXX")

    import sys

    if "backend.config" in sys.modules:
        del sys.modules["backend.config"]

    # Reset global instance
    import backend.config

    backend.config._reset_settings()

    from backend.config import Settings

    with pytest.raises(ValueError, match="ALLOWED_HOSTS vide"):
        Settings()


def test_database_url_dangerous_password_forbidden(monkeypatch):
    """FAILLE #1: Mots de passe dangereux interdits dans DATABASE_URL"""
    monkeypatch.setenv("TESTING", "0")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SECRET_KEY", "a" * 64)
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost/db")
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com")
    monkeypatch.setenv("ALLOWED_HOSTS", "example.com")
    monkeypatch.setenv("STRIPE_API_KEY", "sk_live_XXXXX")
    monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "whsec_XXXXX")

    import sys

    if "backend.config" in sys.modules:
        del sys.modules["backend.config"]

    # Reset global instance
    import backend.config

    backend.config._reset_settings()

    from backend.config import Settings

    with pytest.raises(ValueError, match="mot de passe dangereux"):
        Settings()
