import uuid

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


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

    register_response = client.post("/auth/register", json=register_payload)
    assert register_response.status_code == 200, register_response.text
    payload = register_response.json()
    assert payload["email"] == email
    assert payload["role"] == "patient"
    assert payload["is_active"] is True

    token_response = client.post(
        "/auth/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert token_response.status_code == 200, token_response.text
    token_payload = token_response.json()
    assert token_payload["token_type"] == "bearer"
    assert "access_token" in token_payload

    auth_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
    )
    assert auth_response.status_code == 200, auth_response.text
    user_data = auth_response.json()
    assert user_data["email"] == email
    assert user_data["is_active"] is True
