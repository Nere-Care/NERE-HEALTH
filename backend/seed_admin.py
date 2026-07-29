"""Seed script to create the default admin user.
Run: python seed_admin.py
"""

import os
import uuid
import bcrypt
from db import SessionLocal
from models import User


def seed():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@nere.health")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_password:
        raise ValueError("ADMIN_PASSWORD environment variable is required")

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == admin_email).first()
        if existing:
            print(f"Admin déjà existant: {admin_email}")
            return

        admin = User(
            id=uuid.uuid4(),
            email=admin_email,
            telephone="+237 600000000",
            mot_de_passe_hash=bcrypt.hashpw(
                admin_password.encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8"),
            role="admin",
            statut="actif",
            nom="Admin",
            prenom="Néré",
            email_verifie=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin créé: {admin_email}")
    except Exception as e:
        db.rollback()
        print(f"Erreur: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
