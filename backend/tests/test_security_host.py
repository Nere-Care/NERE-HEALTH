"""
Tests de sécurité pour la validation des hosts - FAILLE #3
Tests unitaires isolés sans dépendance DB
"""
import sys
import asyncio
import pytest
from fastapi import HTTPException, Request
from unittest.mock import Mock, patch

# Imports directs pour éviter les dépendances DB
from backend.main import HostValidationMiddleware, app
from backend.config import _validate_allowed_hosts, parse_comma_list


class TestHostValidation:
    """Tests pour HostValidationMiddleware"""

    def test_host_validation_dev_mode(self):
        """Test que la validation est désactivée en développement"""
        # Simuler un environnement de développement
        import os
        old_env = os.environ.get('ENVIRONMENT')
        os.environ['ENVIRONMENT'] = 'development'

        try:
            # Recharger les settings
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            # Créer une requête mock
            request = Mock(spec=Request)
            request.headers = {'host': 'evil.com'}

            # En dev, devrait passer sans validation
            import asyncio
            async def dummy_call_next(request):
                return Mock()

            result = asyncio.run(middleware.dispatch(request, dummy_call_next))
            assert result is not None  # Pas d'exception levée

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)

    def test_host_validation_prod_valid_host(self):
        """Test validation host valide en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = 'nere-app.com,api.nere-app.com'
        os.environ['SECRET_KEY'] = 'a' * 64  # Clé de 64 caractères pour production
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'sk_live_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_' + 'X' * 100

        try:
            # Recharger les settings
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            request = Mock(spec=Request)
            request.headers = {'host': 'nere-app.com'}

            async def dummy_call_next(request):
                return Mock()

            result = asyncio.run(middleware.dispatch(request, dummy_call_next))
            assert result is not None

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)

    def test_host_validation_prod_invalid_host(self):
        """Test rejet host invalide en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = 'nere-app.com,api.nere-app.com'
        os.environ['SECRET_KEY'] = 'a' * 64
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'sk_live_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_' + 'X' * 100

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            request = Mock(spec=Request)
            request.headers = {'host': 'evil.com'}

            async def dummy_call_next(request):
                return Mock()

            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(middleware.dispatch(request, dummy_call_next))

            assert exc_info.value.status_code == 400
            assert 'non autorisé' in exc_info.value.detail

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)

    def test_host_validation_prod_missing_host_header(self):
        """Test rejet requête sans Host header en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = 'nere-app.com'
        os.environ['SECRET_KEY'] = 'a' * 64
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'test_stripe_key_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'test_webhook_secret_' + 'X' * 100

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            request = Mock(spec=Request)
            request.headers = {}  # Pas de Host header

            async def dummy_call_next(request):
                return Mock()

            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(middleware.dispatch(request, dummy_call_next))

            assert exc_info.value.status_code == 400
            assert 'manquant' in exc_info.value.detail

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)

    def test_host_validation_prod_malformed_host(self):
        """Test rejet host malformé (injection) en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = 'nere-app.com'
        os.environ['SECRET_KEY'] = 'a' * 64
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'sk_live_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_' + 'X' * 100

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            request = Mock(spec=Request)
            request.headers = {'host': 'evil.com\ninjected.com'}

            async def dummy_call_next(request):
                return Mock()

            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(middleware.dispatch(request, dummy_call_next))

            assert exc_info.value.status_code == 400
            assert 'invalide' in exc_info.value.detail

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)

    def test_host_validation_prod_invalid_port(self):
        """Test rejet port invalide en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = 'nere-app.com'
        os.environ['SECRET_KEY'] = 'a' * 64
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'sk_live_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_' + 'X' * 100

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            middleware = HostValidationMiddleware(app, settings.ALLOWED_HOSTS, debug=settings.DEBUG)

            request = Mock(spec=Request)
            request.headers = {'host': 'nere-app.com:8080'}  # Port non standard

            async def dummy_call_next(request):
                return Mock()

            with pytest.raises(HTTPException) as exc_info:
                asyncio.run(middleware.dispatch(request, dummy_call_next))

            assert exc_info.value.status_code == 400
            assert 'non autorisé' in exc_info.value.detail

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)


class TestConfigValidation:
    """Tests pour la validation de configuration ALLOWED_HOSTS"""

    def test_allowed_hosts_validation_prod_empty(self):
        """Test rejet ALLOWED_HOSTS vide en production"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'production'
        os.environ['ALLOWED_HOSTS'] = ''
        os.environ['SECRET_KEY'] = 'a' * 64
        os.environ['DATABASE_URL'] = 'postgresql://user:securepass@localhost/db'
        os.environ['CORS_ORIGINS'] = 'https://nere-app.com'
        os.environ['STRIPE_API_KEY'] = 'sk_live_' + 'X' * 100
        os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_' + 'X' * 100

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']

            with pytest.raises(ValueError) as exc_info:
                from backend.config import Settings
                Settings()

            assert 'ALLOWED_HOSTS vide en production' in str(exc_info.value)

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)

    def test_allowed_hosts_validation_dev_default(self):
        """Test ALLOWED_HOSTS par défaut en développement"""
        import os
        old_env = os.environ.get('ENVIRONMENT')
        old_hosts = os.environ.get('ALLOWED_HOSTS')

        os.environ['ENVIRONMENT'] = 'development'
        os.environ['ALLOWED_HOSTS'] = ''

        try:
            import importlib
            if 'backend.config' in sys.modules:
                del sys.modules['backend.config']
            from backend.config import Settings

            settings = Settings()
            assert 'localhost' in settings.ALLOWED_HOSTS
            assert '127.0.0.1' in settings.ALLOWED_HOSTS

        finally:
            if old_env:
                os.environ['ENVIRONMENT'] = old_env
            else:
                os.environ.pop('ENVIRONMENT', None)
            if old_hosts:
                os.environ['ALLOWED_HOSTS'] = old_hosts
            else:
                os.environ.pop('ALLOWED_HOSTS', None)
