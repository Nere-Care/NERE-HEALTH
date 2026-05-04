import os
import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = PACKAGE_ROOT.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Environnement de test par défaut pour rendre les tests indépendants d'une base PostgreSQL locale
os.environ.setdefault('ENVIRONMENT', 'testing')
os.environ.setdefault('TESTING', '1')
os.environ.setdefault('DEBUG', 'true')
os.environ.setdefault('SECRET_KEY', 'a' * 64)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')
os.environ.setdefault('CORS_ORIGINS', 'http://localhost:4173,http://localhost:5173')
os.environ.setdefault('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver')
os.environ.setdefault('STRIPE_API_KEY', 'sk_test_fake')
os.environ.setdefault('STRIPE_WEBHOOK_SECRET', 'whsec_test_fake')
os.environ.setdefault('OPENAI_API_KEY', 'sk-test-fake')

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import inspect

# Imports directs via package root
try:
    from backend.auth import get_password_hash
    from backend.db import SessionLocal, engine, Base
    from backend.main import app
    from backend.models import User
    from backend.config import settings
except ImportError as e:
    print(f"Import error: {e}")
    get_password_hash = None
    SessionLocal = None
    engine = None
    Base = None
    app = None
    User = None
    settings = None

ALEMBIC_INI_PATH = Path(__file__).resolve().parents[1] / "alembic.ini"
ALEMBIC_SCRIPT_LOCATION = ALEMBIC_INI_PATH.parent / "alembic"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin1234!"


@pytest.fixture(scope="session", autouse=True)
def ensure_database_schema() -> None:
    if not ALEMBIC_INI_PATH.exists() or not ALEMBIC_SCRIPT_LOCATION.exists():
        pytest.skip(
            f"Alembic configuration missing for tests: {ALEMBIC_INI_PATH} or {ALEMBIC_SCRIPT_LOCATION}"
        )

    required_tables = ["users", "token_blacklist"]
    try:
        with engine.connect() as conn:
            inspector = inspect(conn)
            if all(inspector.has_table(table) for table in required_tables):
                return
    except Exception as exc:
        pytest.skip(f"Database unavailable for tests: {exc}")

    if settings.DATABASE_URL.startswith("sqlite"):
        if Base is not None:
            Base.metadata.create_all(bind=engine)
        return

    alembic_cfg = Config(str(ALEMBIC_INI_PATH))
    alembic_cfg.set_main_option(
        "sqlalchemy.url",
        settings.DATABASE_URL,
    )
    alembic_cfg.set_main_option(
        "script_location",
        str(ALEMBIC_SCRIPT_LOCATION),
    )
    try:
        command.upgrade(alembic_cfg, "head")
    except Exception as exc:
        pytest.skip(f"Unable to initialize test schema: {exc}")


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


@pytest.fixture(scope="session")
def medecin_auth_header() -> dict[str, str]:
    medecin_email = "medecin@example.com"
    medecin_password = "Medecin123!"

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == medecin_email).first()
        if not user:
            user = User(
                email=medecin_email,
                prenom="Médecin",
                nom="Test",
                mot_de_passe_hash=get_password_hash(medecin_password),
                role="medecin",
                statut="actif",
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    client = TestClient(app)
    token_response = client.post(
        "/auth/token",
        data={"username": medecin_email, "password": medecin_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert token_response.status_code == 200, token_response.text
    token_payload = token_response.json()
    return {"Authorization": f"Bearer {token_payload['access_token']}"}


@pytest.fixture(scope="function")
def db() -> SessionLocal:
    with SessionLocal() as session:
        yield session
