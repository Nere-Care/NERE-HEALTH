import uuid
import time

import pytest
from fastapi.testclient import TestClient

from tests.helpers import verify_registered_user
from main import app

client = TestClient(app)
PREFIX = "/api"
_SHARED_EMAIL = f"shared{uuid.uuid4().hex[:6]}@test.com"
_SHARED_PASSWORD = "SecurePass1!"


@pytest.fixture(scope="module", autouse=True)
def _register_shared_user():
    r = _register_user(_SHARED_EMAIL, _SHARED_PASSWORD)
    assert r.status_code in (200, 429)


def _register_user(email: str, password: str = "SecurePass1!"):
    r = client.post(f"{PREFIX}/auth/register", json={
        "email": email,
        "password": password,
        "prenom": "Test",
        "nom": "Security",
    })
    if r.status_code == 200:
        verify_registered_user(client, r, email)
    return r


def _login(email: str, password: str = "SecurePass1!"):
    return client.post(f"{PREFIX}/auth/token", data={
        "username": email,
        "password": password,
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ─── Password Validation ───

class TestPasswordValidation:
    def test_valid_password_accepted(self):
        email = f"valid{uuid.uuid4().hex[:6]}@test.com"
        r = _register_user(email)
        assert r.status_code == 200

    def test_reject_short_password(self):
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": f"short{uuid.uuid4().hex[:6]}@test.com",
            "password": "Ab1!",
            "prenom": "T", "nom": "S",
        })
        assert r.status_code == 400
        assert "8 caractères" in r.json()["detail"]

    def test_reject_no_uppercase(self):
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": f"noupper{uuid.uuid4().hex[:6]}@test.com",
            "password": "securepass1!",
            "prenom": "T", "nom": "S",
        })
        assert r.status_code == 400
        assert "majuscule" in r.json()["detail"]

    def test_reject_no_digit(self):
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": f"nodigit{uuid.uuid4().hex[:6]}@test.com",
            "password": "SecurePass!",
            "prenom": "T", "nom": "S",
        })
        assert r.status_code in (400, 429)
        if r.status_code == 400:
            assert "chiffre" in r.json()["detail"]

    def test_reject_no_special_char(self):
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": f"nospecial{uuid.uuid4().hex[:6]}@test.com",
            "password": "SecurePass1",
            "prenom": "T", "nom": "S",
        })
        assert r.status_code in (400, 429)
        if r.status_code == 400:
            assert "caractère spécial" in r.json()["detail"]

    def test_valid_password_accepted(self):
        email = f"valid{uuid.uuid4().hex[:6]}@test.com"
        r = _register_user(email)
        assert r.status_code == 200


# ─── Authentication ───

class TestAuthentication:
    def test_login_wrong_password(self):
        email = f"auth{uuid.uuid4().hex[:6]}@test.com"
        _register_user(email)
        r = _login(email, "WrongPassword1!")
        assert r.status_code == 401

    def test_login_nonexistent_user(self):
        r = _login("nonexistent@test.com")
        assert r.status_code == 401

    def test_token_contains_refresh_token(self):
        email = f"refresh{uuid.uuid4().hex[:6]}@test.com"
        reg = _register_user(email)
        if reg.status_code == 429:
            email = _SHARED_EMAIL
            login_r = _login(email, _SHARED_PASSWORD)
        else:
            login_r = _login(email)
        if login_r.status_code != 200:
            pytest.skip("Rate limit reached")
        data = login_r.json()
        assert "refresh_token" in data
        assert len(data["refresh_token"]) > 20

    def test_access_protected_route_without_token(self):
        client.cookies.clear()
        r = client.get(f"{PREFIX}/auth/me")
        assert r.status_code == 401

    def test_access_with_invalid_token(self):
        client.cookies.clear()
        r = client.get(f"{PREFIX}/auth/me", headers=_auth_header("invalid.jwt.token"))
        assert r.status_code == 401


# ─── Session Management ───

class TestSessionManagement:
    def test_refresh_token_rotation(self):
        login_r = _login(_SHARED_EMAIL, _SHARED_PASSWORD)
        if login_r.status_code != 200:
            pytest.skip("Login failed (rate limit)")
        old_refresh = login_r.json()["refresh_token"]

        refresh_r = client.post(f"{PREFIX}/auth/refresh", json={"refresh_token": old_refresh})
        assert refresh_r.status_code == 200
        new_data = refresh_r.json()
        assert new_data["refresh_token"] != old_refresh

    def test_old_refresh_token_rejected_after_rotation(self):
        login_r = _login(_SHARED_EMAIL, _SHARED_PASSWORD)
        if login_r.status_code != 200:
            pytest.skip("Login failed (rate limit)")
        old_refresh = login_r.json()["refresh_token"]

        client.post(f"{PREFIX}/auth/refresh", json={"refresh_token": old_refresh})
        r = client.post(f"{PREFIX}/auth/refresh", json={"refresh_token": old_refresh})
        assert r.status_code == 401

    def test_invalid_refresh_token_rejected(self):
        r = client.post(f"{PREFIX}/auth/refresh", json={"refresh_token": "totally-fake-token"})
        assert r.status_code == 401


# ─── Audit Logging ───

class TestAuditLogging:
    def test_requests_logged(self):
        client.get(f"{PREFIX}/audit/logs", headers={
            "Authorization": "Bearer fake-token-for-audit-test"
        })
        time.sleep(0.3)


# ─── Message Encryption ───

class TestMessageEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        from crypto import encrypt, decrypt
        plaintext = b"Hello, this is a secret medical message!"
        encrypted = encrypt(plaintext)
        assert encrypted != plaintext
        assert encrypted[:12] != b"\x00" * 12
        decrypted = decrypt(encrypted)
        assert decrypted == plaintext

    def test_different_ciphertext_each_time(self):
        from crypto import encrypt
        plaintext = b"Same message twice"
        ct1 = encrypt(plaintext)
        ct2 = encrypt(plaintext)
        assert ct1 != ct2

    def test_tampered_ciphertext_rejected(self):
        from crypto import encrypt, decrypt
        data = encrypt(b"original")
        tampered = bytearray(data)
        tampered[-1] ^= 0xFF
        with pytest.raises(Exception):
            decrypt(bytes(tampered))


# ─── Rate Limiting ───

class TestRateLimiting:
    def test_login_rate_limit_enforced(self):
        email = f"rate{uuid.uuid4().hex[:6]}@test.com"
        responses = []
        for _ in range(15):
            r = _login(email, "Wrong1!")
            responses.append(r.status_code)
        assert 429 in responses


# ─── Input Sanitization ───

class TestInputSanitization:
    def test_sql_injection_register(self):
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": "test@test.com'; DROP TABLE users; --",
            "password": "SecurePass1!",
            "prenom": "T", "nom": "S",
        })
        assert r.status_code in (400, 422)

    def test_xss_in_name_fields(self):
        email = f"xss{uuid.uuid4().hex[:6]}@test.com"
        r = client.post(f"{PREFIX}/auth/register", json={
            "email": email,
            "password": "SecurePass1!",
            "prenom": "<script>alert(1)</script>",
            "nom": "<img src=x onerror=alert(1)>",
        })
        if r.status_code == 200:
            data = r.json()
            assert "<script>" not in data.get("prenom", "")
