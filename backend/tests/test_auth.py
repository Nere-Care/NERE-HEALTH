import uuid

import pytest
from fastapi.testclient import TestClient

from tests.helpers import verify_registered_user
from main import app

client = TestClient(app)
PREFIX = "/api"


def is_backend_available() -> bool:
    response = client.get("/")
    return response.status_code == 200


def test_register_and_login_flow():
    if not is_backend_available():
        pytest.skip("Backend health check failed")

    email = f"test+{uuid.uuid4().hex[:8]}@example.com"
    password = "Test1234!"
    register_payload = {
        "email": email,
        "password": password,
        "prenom": "Test",
        "nom": "Utilisateur",
    }

    register_response = client.post(f"{PREFIX}/auth/register", json=register_payload)
    assert register_response.status_code == 200, register_response.text
    payload = register_response.json()
    assert payload["email"] == email
    assert payload["role"] == "patient"
    assert payload["is_active"] is True
    assert payload["email_verifie"] is False
    assert payload["dev_verification_token"]

    # Tant que l'email n'est pas confirmé, la connexion est refusée.
    blocked_response = client.post(
        f"{PREFIX}/auth/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert blocked_response.status_code == 403
    assert blocked_response.json()["detail"]["code"] == "EMAIL_NOT_VERIFIED"

    verify_registered_user(client, register_response, email)

    token_response = client.post(
        f"{PREFIX}/auth/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert token_response.status_code == 200, token_response.text
    token_payload = token_response.json()
    assert token_payload["token_type"] == "bearer"
    assert "access_token" in token_payload

    auth_response = client.get(
        f"{PREFIX}/auth/me",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
    )
    assert auth_response.status_code == 200, auth_response.text
    user_data = auth_response.json()
    assert user_data["email"] == email
    assert user_data["is_active"] is True
