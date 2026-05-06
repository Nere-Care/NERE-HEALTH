"""
🔐 TESTS DE SÉCURITÉ - CORS
Vérifie que les CORS sont restrictifs et ne permettent pas d'origines non-autorisées
"""

import pytest
from fastapi.testclient import TestClient

try:
    from backend.main import app
except ImportError:
    from main import app


client = TestClient(app)


def test_cors_invalid_origin_rejected():
    """FAILLE #2: Origines non-autorisées doivent être rejetées"""
    response = client.options(
        "/api/users",
        headers={
            "Origin": "https://malicious.com",
            "Access-Control-Request-Method": "GET",
        },
    )

    # L'origine malveillante ne doit pas être dans les headers CORS
    assert (
        "Access-Control-Allow-Origin" not in response.headers
        or response.headers.get("Access-Control-Allow-Origin") != "https://malicious.com"
    )


def test_cors_allowed_methods_not_wildcard():
    """FAILLE #2: Allow-Methods ne doit jamais être '*'"""
    response = client.options(
        "/api/users",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    # Vérifier que le header CORS ne contient pas "*"
    allowed_methods = response.headers.get("Access-Control-Allow-Methods", "")
    assert "*" not in allowed_methods, "allow_methods=* est interdit"


def test_cors_allowed_headers_not_wildcard():
    """FAILLE #2: Allow-Headers ne doit jamais être '*'"""
    response = client.options(
        "/api/users",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    # Vérifier que le header CORS ne contient pas "*"
    allowed_headers = response.headers.get("Access-Control-Allow-Headers", "")
    assert "*" not in allowed_headers, "allow_headers=* est interdit"


def test_cors_credentials_handled_safely():
    """FAILLE #2: Credentials CORS doit être utilisé avec prudence"""
    response = client.options(
        "/api/users",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    # Si allow_credentials=true, then allow_origins DOIT être spécifique (pas "*")
    allow_creds = response.headers.get("Access-Control-Allow-Credentials")
    allow_origin = response.headers.get("Access-Control-Allow-Origin")

    if allow_creds == "true":
        assert allow_origin != "*", "allow_credentials=true avec allow_origins=* est dangereux"


def test_cors_security_headers_present():
    """FAILLE #2: Security headers doivent être présents"""
    response = client.get("/health")

    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in response.headers


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
