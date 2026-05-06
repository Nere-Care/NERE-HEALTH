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
from backend.main import HostValidationMiddleware
from backend.config import _validate_allowed_hosts, parse_comma_list


class TestHostValidation:
    """Tests pour HostValidationMiddleware"""

    @pytest.mark.asyncio
    async def test_host_validation_valid_host(self):
        """Test validation host valide"""
        middleware = HostValidationMiddleware(None, ["nere-app.com", "api.nere-app.com"])

        request = Mock(spec=Request)
        request.headers = {"host": "nere-app.com"}

        async def dummy_call_next(request):
            return "success"

        result = await middleware.dispatch(request, dummy_call_next)
        assert result == "success"

    @pytest.mark.asyncio
    async def test_host_validation_invalid_host(self):
        """Test rejet host invalide"""
        middleware = HostValidationMiddleware(None, ["nere-app.com", "api.nere-app.com"])

        request = Mock(spec=Request)
        request.headers = {"host": "evil.com"}

        async def dummy_call_next(request):
            return "success"

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(request, dummy_call_next)

        assert exc_info.value.status_code == 400
        assert "non autorisé" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_host_validation_missing_host_header(self):
        """Test rejet requête sans Host header"""
        middleware = HostValidationMiddleware(None, ["nere-app.com"])

        request = Mock(spec=Request)
        request.headers = {}  # Pas de Host header

        async def dummy_call_next(request):
            return "success"

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(request, dummy_call_next)

        assert exc_info.value.status_code == 400
        assert "manquant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_host_validation_malformed_host(self):
        """Test rejet host malformé (injection)"""
        middleware = HostValidationMiddleware(None, ["nere-app.com"])

        request = Mock(spec=Request)
        request.headers = {"host": "evil.com\ninjected.com"}

        async def dummy_call_next(request):
            return "success"

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(request, dummy_call_next)

        assert exc_info.value.status_code == 400
        assert "invalide" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_host_validation_invalid_port(self):
        """Test rejet port invalide"""
        middleware = HostValidationMiddleware(None, ["nere-app.com"])

        request = Mock(spec=Request)
        request.headers = {"host": "nere-app.com:8080"}  # Port non standard

        async def dummy_call_next(request):
            return "success"

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(request, dummy_call_next)

        assert exc_info.value.status_code == 400
        assert "non autorisé" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_host_validation_valid_ports(self):
        """Test acceptation ports valides (80, 443)"""
        middleware = HostValidationMiddleware(None, ["nere-app.com"])

        for port in [80, 443]:
            request = Mock(spec=Request)
            request.headers = {"host": f"nere-app.com:{port}"}

            async def dummy_call_next(request):
                return "success"

            result = await middleware.dispatch(request, dummy_call_next)
            assert result == "success"

    @pytest.mark.asyncio
    async def test_host_validation_case_insensitive(self):
        """Test validation insensible à la casse"""
        middleware = HostValidationMiddleware(None, ["NERE-APP.COM"], debug=False)

        request = Mock(spec=Request)
        request.headers = {"host": "nere-app.com"}

        async def dummy_call_next(request):
            return "success"

        result = await middleware.dispatch(request, dummy_call_next)
        assert result == "success"


class TestConfigValidation:
    """Tests pour la validation de configuration ALLOWED_HOSTS"""

    def test_allowed_hosts_validation_dev_empty(self):
        """Test ALLOWED_HOSTS vide en développement retourne defaults"""
        result = _validate_allowed_hosts([], "development")
        assert result == ["localhost", "127.0.0.1"]

    def test_allowed_hosts_validation_prod_empty(self):
        """Test rejet ALLOWED_HOSTS vide en production"""
        with pytest.raises(ValueError) as exc_info:
            _validate_allowed_hosts([], "production")

        assert "ALLOWED_HOSTS vide en production" in str(exc_info.value)

    def test_allowed_hosts_validation_prod_valid(self):
        """Test ALLOWED_HOSTS valide en production"""
        hosts = ["nere-app.com", "api.nere-app.com"]
        result = _validate_allowed_hosts(hosts, "production")
        assert result == hosts

    def test_parse_comma_list(self):
        """Test parsing de liste séparée par virgules"""
        result = parse_comma_list("a,b,c", "default")
        assert result == ["a", "b", "c"]

        result = parse_comma_list("", "x,y")
        assert result == ["x", "y"]

        result = parse_comma_list(None, "x,y")
        assert result == ["x", "y"]
