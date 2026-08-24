import uuid
from datetime import datetime, timedelta, timezone

import pytest
import pyotp
from fastapi.testclient import TestClient

from tests.helpers import verify_registered_user
from db import SessionLocal
from limiter import limiter
from main import app

client = TestClient(app)
PREFIX = "/api"


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()


def _register(email: str, password: str = "SecurePass1!"):
    return client.post(f"{PREFIX}/auth/register", json={
        "email": email,
        "password": password,
        "prenom": "Test",
        "nom": "Email2FA",
    })


def _login(email: str, password: str = "SecurePass1!"):
    return client.post(
        f"{PREFIX}/auth/token",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _new_user(verified: bool = True):
    email = f"v{uuid.uuid4().hex[:8]}@test.com"
    reg = _register(email)
    assert reg.status_code == 200, reg.text
    if verified:
        verify_registered_user(client, reg, email)
    return email, reg.json()


# ─── Vérification d'email ───

class TestEmailVerification:
    def test_register_creates_pending_unverified_account(self):
        email, data = _new_user(verified=False)
        assert data["email_verifie"] is False
        assert data["is_active"] is True
        assert data["dev_verification_token"]
        assert data["dev_verification_code"]

    def test_login_blocked_before_verification(self):
        email, _ = _new_user(verified=False)
        r = _login(email)
        assert r.status_code == 403
        assert r.json()["detail"]["code"] == "EMAIL_NOT_VERIFIED"

    def test_verify_email_by_token_then_login(self):
        email, data = _new_user(verified=False)
        r = client.post(f"{PREFIX}/auth/verify-email", json={"token": data["dev_verification_token"]})
        assert r.status_code == 200, r.text
        assert r.json()["email"] == email
        assert _login(email).status_code == 200

    def test_verify_email_by_code_then_login(self):
        email, data = _new_user(verified=False)
        r = client.post(f"{PREFIX}/auth/verify-email-code", json={
            "email": email,
            "code": data["dev_verification_code"],
        })
        assert r.status_code == 200, r.text
        assert _login(email).status_code == 200

    def test_verify_email_invalid_token(self):
        r = client.post(f"{PREFIX}/auth/verify-email", json={"token": "not-a-real-token"})
        assert r.status_code == 400
        assert "invalide" in r.json()["detail"]

    def test_verify_email_wrong_code(self):
        email, _ = _new_user(verified=False)
        r = client.post(f"{PREFIX}/auth/verify-email-code", json={"email": email, "code": "000000"})
        assert r.status_code == 400
        assert _login(email).status_code == 403

    def _expire_user_credentials(self, email: str, *, token: bool = True, code: bool = True):
        from models import User

        with SessionLocal() as session:
            user = session.query(User).filter(User.email == email).one()
            past = datetime.now(timezone.utc) - timedelta(minutes=1)
            if token:
                user.email_verification_expires = past
            if code:
                user.email_otp_expires = past
            session.commit()

    def test_verify_email_expired_token(self):
        email, data = _new_user(verified=False)
        self._expire_user_credentials(email, token=True, code=False)
        r = client.post(f"{PREFIX}/auth/verify-email", json={"token": data["dev_verification_token"]})
        assert r.status_code == 400
        assert "expiré" in r.json()["detail"]
        assert _login(email).status_code == 403

    def test_verify_email_expired_code(self):
        email, data = _new_user(verified=False)
        self._expire_user_credentials(email, token=False, code=True)
        r = client.post(f"{PREFIX}/auth/verify-email-code", json={
            "email": email,
            "code": data["dev_verification_code"],
        })
        assert r.status_code == 400
        assert "expiré" in r.json()["detail"]
        assert _login(email).status_code == 403

    def test_resend_refreshes_expiry(self):
        email, data = _new_user(verified=False)
        self._expire_user_credentials(email, token=True, code=True)
        r = client.post(f"{PREFIX}/auth/resend-verification", json={"email": email})
        assert r.status_code == 200, r.text
        # après renvoi, le lien redevient utilisable (expiry recalculée)
        r2 = client.post(f"{PREFIX}/auth/verify-email", json={"token": r.json().get("dev_verification_token") or data["dev_verification_token"]})
        assert r2.status_code == 200, r2.text

    def test_resend_verification_regenerates_credentials(self):
        email, data = _new_user(verified=False)
        r = client.post(f"{PREFIX}/auth/resend-verification", json={"email": email})
        assert r.status_code == 200, r.text
        assert _login(email).status_code == 403
        new_code = data["dev_verification_code"]
        # un seul renvoi par test pour rester sous la limite 3/15min

    def test_login_after_verification_returns_active_user(self):
        email, _ = _new_user(verified=True)
        r = _login(email)
        assert r.status_code == 200, r.text
        token = r.json()["access_token"]
        me = client.get(f"{PREFIX}/auth/me", headers=_auth_header(token))
        assert me.status_code == 200
        assert me.json()["email_verifie"] is True
        assert me.json()["is_active"] is True


# ─── Double authentification (TOTP) ───

class TestTwoFactor:
    def _setup_and_enable(self):
        email, _ = _new_user(verified=True)
        token = _login(email).json()["access_token"]
        headers = _auth_header(token)

        setup = client.post(f"{PREFIX}/auth/2fa/setup", headers=headers)
        assert setup.status_code == 200, setup.text
        secret = setup.json()["secret"]
        assert setup.json()["qr_code"].startswith("data:image/png;base64,")

        code = pyotp.TOTP(secret).now()
        enable = client.post(f"{PREFIX}/auth/2fa/enable", json={"code": code}, headers=headers)
        assert enable.status_code == 200, enable.text
        assert enable.json()["totp_actif"] is True
        return email, secret

    def test_full_twofa_flow(self):
        email, secret = self._setup_and_enable()

        # Le login exige désormais l'étape 2FA
        login = _login(email)
        assert login.status_code == 200, login.text
        data = login.json()
        assert data["requires_2fa"] is True
        assert data["totp_token"]
        assert data["access_token"] == ""

        # Étape 2FA avec le bon code TOTP
        code = pyotp.TOTP(secret).now()
        verify = client.post(f"{PREFIX}/auth/verify-2fa", json={
            "code": code,
            "totp_token": data["totp_token"],
        })
        assert verify.status_code == 200, verify.text
        assert "access_token" in verify.json()

        # Désactivation avec un code TOTP valide
        token = verify.json()["access_token"]
        disable = client.post(f"{PREFIX}/auth/2fa/disable", json={"code": code}, headers=_auth_header(token))
        assert disable.status_code == 200, disable.text
        assert disable.json()["totp_actif"] is False

        # Une fois désactivé, le login redevient direct
        login2 = _login(email)
        assert login2.status_code == 200
        assert login2.json().get("requires_2fa") is False

    def test_login_requires_2fa_wrong_code(self):
        email, secret = self._setup_and_enable()
        login = _login(email)
        assert login.json()["requires_2fa"] is True
        r = client.post(f"{PREFIX}/auth/verify-2fa", json={
            "code": pyotp.TOTP("A" * 32).now(),
            "totp_token": login.json()["totp_token"],
        })
        assert r.status_code == 401

    def test_verify_2fa_bad_token(self):
        r = client.post(f"{PREFIX}/auth/verify-2fa", json={
            "code": "123456",
            "totp_token": "not-a-jwt",
        })
        assert r.status_code == 401

    def test_enable_without_setup_rejected(self):
        email, _ = _new_user(verified=True)
        token = _login(email).json()["access_token"]
        r = client.post(f"{PREFIX}/auth/2fa/enable", json={"code": "123456"}, headers=_auth_header(token))
        assert r.status_code == 400
        assert "secret" in r.json()["detail"].lower()
