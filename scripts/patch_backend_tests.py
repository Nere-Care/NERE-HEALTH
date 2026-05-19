from pathlib import Path

root = Path(__file__).resolve().parent.parent
backend_tests = root / 'backend' / 'tests'

# Update test_routes_coverage import path
file_path = backend_tests / 'test_routes_coverage.py'
text = file_path.read_text(encoding='utf-8')
text = text.replace('from main import app', 'from backend.main import app')
file_path.write_text(text, encoding='utf-8')

# Fix test_security_config.py fully
file_path = backend_tests / 'test_security_config.py'
file_path.write_text('''"""
🔐 TESTS DE SÉCURITÉ - Configuration et Secrets
Vérifie que les secrets codés en dur lèvent des exceptions en production
"""

import pytest


def test_secret_key_not_default_in_production(monkeypatch):
    """FAILLE #1: SECRET_KEY='change-me' ne doit pas être acceptée en production"""
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('SECRET_KEY', 'change-me')
    monkeypatch.setenv('DATABASE_URL', 'postgresql://user:pass@localhost/db')
    monkeypatch.setenv('CORS_ORIGINS', 'https://example.com')
    monkeypatch.setenv('ALLOWED_HOSTS', 'example.com')
    monkeypatch.setenv('STRIPE_API_KEY', 'sk_live_XXXXX')
    monkeypatch.setenv('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXX')

    import sys
    if 'backend.config' in sys.modules:
        del sys.modules['backend.config']

    from backend.config import Settings

    with pytest.raises(ValueError, match='SECRET_KEY'):
        Settings()


def test_secret_key_too_short_in_production(monkeypatch):
    """FAILLE #1: SECRET_KEY doit faire au minimum 64 caractères"""
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('SECRET_KEY', 'short-key-12345')
    monkeypatch.setenv('DATABASE_URL', 'postgresql://user:securepass@localhost/db')
    monkeypatch.setenv('CORS_ORIGINS', 'https://example.com')
    monkeypatch.setenv('ALLOWED_HOSTS', 'example.com')
    monkeypatch.setenv('STRIPE_API_KEY', 'sk_live_XXXXX')
    monkeypatch.setenv('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXX')

    import sys
    if 'backend.config' in sys.modules:
        del sys.modules['backend.config']

    from backend.config import Settings
    with pytest.raises(ValueError, match='64 caractères'):
        Settings()


def test_cors_wildcard_forbidden_in_production(monkeypatch):
    """FAILLE #2: CORS_ORIGINS=* interdit en production"""
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('SECRET_KEY', 'a' * 64)
    monkeypatch.setenv('DATABASE_URL', 'postgresql://user:securepass@localhost/db')
    monkeypatch.setenv('CORS_ORIGINS', '*')
    monkeypatch.setenv('ALLOWED_HOSTS', 'example.com')
    monkeypatch.setenv('STRIPE_API_KEY', 'sk_live_XXXXX')
    monkeypatch.setenv('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXX')

    import sys
    if 'backend.config' in sys.modules:
        del sys.modules['backend.config']

    from backend.config import Settings
    with pytest.raises(ValueError, match='CORS_ORIGINS=\\* est interdite'):
        Settings()


def test_allowed_hosts_required_in_production(monkeypatch):
    """FAILLE #2: ALLOWED_HOSTS obligatoire en production"""
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('SECRET_KEY', 'a' * 64)
    monkeypatch.setenv('DATABASE_URL', 'postgresql://user:securepass@localhost/db')
    monkeypatch.setenv('CORS_ORIGINS', 'https://example.com')
    monkeypatch.setenv('ALLOWED_HOSTS', '')
    monkeypatch.setenv('STRIPE_API_KEY', 'sk_live_XXXXX')
    monkeypatch.setenv('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXX')

    import sys
    if 'backend.config' in sys.modules:
        del sys.modules['backend.config']

    from backend.config import Settings
    with pytest.raises(ValueError, match='ALLOWED_HOSTS vide'):
        Settings()


def test_database_url_dangerous_password_forbidden(monkeypatch):
    """FAILLE #1: Mots de passe dangereux interdits dans DATABASE_URL"""
    monkeypatch.setenv('ENVIRONMENT', 'production')
    monkeypatch.setenv('SECRET_KEY', 'a' * 64)
    monkeypatch.setenv('DATABASE_URL', 'postgresql://user:nere_pass@localhost/db')
    monkeypatch.setenv('CORS_ORIGINS', 'https://example.com')
    monkeypatch.setenv('ALLOWED_HOSTS', 'example.com')
    monkeypatch.setenv('STRIPE_API_KEY', 'sk_live_XXXXX')
    monkeypatch.setenv('STRIPE_WEBHOOK_SECRET', 'whsec_XXXXX')

    import sys
    if 'backend.config' in sys.modules:
        del sys.modules['backend.config']

    from backend.config import Settings
    with pytest.raises(ValueError, match='mot de passe dangereux'):
        Settings()
''', encoding='utf-8')

# Update test_failles_789 imports and schema references
file_path = backend_tests / 'test_failles_789.py'
text = file_path.read_text(encoding='utf-8')
text = text.replace('from jwt_handler import JWTHandler', 'from backend.jwt_handler import JWTHandler')
text = text.replace('from encryption import EncryptionManager', 'from backend.encryption import EncryptionManager')
text = text.replace('from https_middleware import HTTPSEnforcementMiddleware', 'from backend.https_middleware import HTTPSEnforcementMiddleware')
text = text.replace('from input_validator import InputValidator', 'from backend.input_validator import InputValidator')
text = text.replace('from models import TokenBlacklist', 'from backend.models import TokenBlacklist')
text = text.replace('from models import TokenRotationLog', 'from backend.models import TokenRotationLog')
text = text.replace('from config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES', 'from backend.config import settings')
text = text.replace('from config import SECRET_KEY, REFRESH_TOKEN_EXPIRE_DAYS', 'from backend.config import settings')
text = text.replace('from config import SECRET_KEY', 'from backend.config import settings')
text = text.replace('from input_validator import UserRegisterSchema, ConsultationSchema', 'from backend.schemas import UserCreate, ConsultationCreate')
text = text.replace('UserRegisterSchema(', 'UserCreate(')
text = text.replace('ConsultationSchema', 'ConsultationCreate')
text = text.replace('decoded = pyjwt.decode(token, SECRET_KEY, algorithms=["HS256"])', 'decoded = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])')
text = text.replace('decoded = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])', 'decoded = pyjwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])')
text = text.replace('ACCESS_TOKEN_EXPIRE_MINUTES', 'JWTHandler.ACCESS_TOKEN_EXPIRE_MINUTES')
text = text.replace('REFRESH_TOKEN_EXPIRE_DAYS', 'JWTHandler.REFRESH_TOKEN_EXPIRE_DAYS')
file_path.write_text(text, encoding='utf-8')

print('Patch complete')
