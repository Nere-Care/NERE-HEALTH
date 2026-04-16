import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from auth import get_password_hash
from db import SessionLocal, engine
from main import app
from models import User

ALEMBIC_INI_PATH = Path(__file__).resolve().parents[1] / "alembic.ini"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin1234!"


@pytest.fixture(scope="session", autouse=True)
def ensure_database_schema() -> None:
    if not ALEMBIC_INI_PATH.exists():
        pytest.skip(f"Alembic config not found: {ALEMBIC_INI_PATH}")

    with engine.connect() as conn:
        inspector = inspect(conn)
        if inspector.has_table("users"):
            return

    alembic_cfg = Config(str(ALEMBIC_INI_PATH))
    alembic_cfg.set_main_option(
        "sqlalchemy.url",
        os.getenv("DATABASE_URL", "postgresql://nere_user:nere_pass@localhost:5432/nere_db"),
    )
    command.upgrade(alembic_cfg, "head")


@pytest.fixture(scope="session")
def admin_auth_header() -> dict[str, str]:
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not user:
            user = User(
                email=ADMIN_EMAIL,
                prenom="Admin",
                nom="Test",
                mot_de_passe_hash=get_password_hash(ADMIN_PASSWORD),
                role="admin",
                statut="actif",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    client = TestClient(app)
    token_response = client.post(
        "/auth/token",
        data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert token_response.status_code == 200, token_response.text
    token_payload = token_response.json()
    return {"Authorization": f"Bearer {token_payload['access_token']}"}
