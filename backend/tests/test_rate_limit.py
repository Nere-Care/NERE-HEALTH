import uuid

import pytest
from fastapi.testclient import TestClient

from tests.helpers import verify_registered_user
from limiter import limiter
from main import app

client = TestClient(app)
PREFIX = "/api"


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Reset the in-memory rate limiter so tests are deterministic and isolated."""
    limiter.reset()
    yield
    limiter.reset()


def _register(email: str, password: str = "SecurePass1!"):
    r = client.post(f"{PREFIX}/auth/register", json={
        "email": email,
        "password": password,
        "prenom": "Test",
        "nom": "RateLimit",
    })
    if r.status_code == 200:
        verify_registered_user(client, r, email)
    return r


def _login(email: str, password: str):
    return client.post(
        f"{PREFIX}/auth/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def test_login_locked_after_failed_attempts():
    email = f"lock{uuid.uuid4().hex[:6]}@test.com"
    password = "LockPass1!"
    assert _register(email, password).status_code == 200

    for _ in range(5):
        assert _login(email, "WrongPass1!").status_code == 401

    # Even with the correct password, the account is temporarily blocked
    r = _login(email, password)
    assert r.status_code == 429
    assert "bloqué" in r.json()["detail"]


def test_successful_login_resets_attempts():
    email = f"rstr{uuid.uuid4().hex[:6]}@test.com"
    password = "ResetPass1!"
    assert _register(email, password).status_code == 200

    for _ in range(3):
        assert _login(email, "WrongPass1!").status_code == 401

    assert _login(email, password).status_code == 200

    # Counter was reset: a fresh set of failures is needed to lock again
    for _ in range(5):
        assert _login(email, "WrongPass1!").status_code == 401

    assert _login(email, password).status_code == 429


def test_unknown_email_is_not_blocked():
    # Non-existent accounts must not be recorded (no enumeration via lockout)
    for _ in range(8):
        assert _login(f"ghost{uuid.uuid4().hex[:6]}@test.com", "WrongPass1!").status_code == 401


def test_forgot_and_reset_password_flow():
    email = f"forgot{uuid.uuid4().hex[:6]}@test.com"
    password = "ForgotPass1!"
    assert _register(email, password).status_code == 200

    r = client.post(f"{PREFIX}/auth/forgot-password", json={"email": email})
    assert r.status_code == 200
    token = r.json().get("reset_token")
    assert token

    new_password = "NewPass123!"
    r = client.post(f"{PREFIX}/auth/reset-password", json={"token": token, "new_password": new_password})
    assert r.status_code == 200

    assert _login(email, new_password).status_code == 200
    assert _login(email, password).status_code == 401


def test_forgot_password_unknown_email_returns_generic():
    r = client.post(f"{PREFIX}/auth/forgot-password", json={"email": "nobody@example.com"})
    assert r.status_code == 200
    assert "reset_token" not in r.json()


def test_reset_password_invalid_token():
    r = client.post(f"{PREFIX}/auth/reset-password", json={"token": "invalid-token", "new_password": "NewPass123!"})
    assert r.status_code == 400


def test_forgot_password_rate_limited():
    codes = []
    for _ in range(6):
        r = client.post(f"{PREFIX}/auth/forgot-password", json={"email": "any@example.com"})
        codes.append(r.status_code)
    assert 429 in codes
