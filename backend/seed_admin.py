"""Seed script to create the default admin user.
Run: python seed_admin.py
"""

import uuid
import bcrypt
from db import SessionLocal
from models import User

ADMIN_EMAIL = "admin@nere.health"
ADMIN_PASSWORD = "Admin123!"


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin déjà existant: {ADMIN_EMAIL}")
            return

        admin = User(
            id=uuid.uuid4(),
            email=ADMIN_EMAIL,
            telephone="+237 600000000",
            mot_de_passe_hash=bcrypt.hashpw(
                ADMIN_PASSWORD.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8"),
            role="admin",
            statut="actif",
            nom="Admin",
            prenom="Néré",
            email_verifie=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin créé: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    except Exception as e:
        db.rollback()
        print(f"Erreur: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
