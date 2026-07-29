"""add missing user/medecin columns to match models

Adds columns that exist in SQLAlchemy models but were never
added to the database via migration:

User: timezone, adresse, date_naissance
Medecin: presentation, expertises, actes, experience_history,
         documents, tarif_modification, structure_modification,
         ville, district

Revision ID: 0016_add_missing_user_medecin_columns
Revises: 0015_add_methodes_retrait
Create Date: 2026-07-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0016_add_missing_user_medecin_columns"
down_revision = "0015_add_methodes_retrait"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- User columns ---
    op.add_column(
        "users",
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Africa/Douala"),
    )
    op.add_column(
        "users",
        sa.Column("adresse", sa.Text(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("date_naissance", sa.Date(), nullable=True),
    )

    # --- Medecin columns ---
    op.add_column(
        "medecins",
        sa.Column("presentation", sa.Text(), nullable=True),
    )
    op.add_column(
        "medecins",
        sa.Column(
            "expertises",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "medecins",
        sa.Column(
            "actes",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "medecins",
        sa.Column(
            "experience_history",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "medecins",
        sa.Column(
            "documents",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
    )
    op.add_column(
        "medecins",
        sa.Column("tarif_modification", postgresql.JSONB(), nullable=True),
    )
    op.add_column(
        "medecins",
        sa.Column("structure_modification", postgresql.JSONB(), nullable=True),
    )
    op.add_column(
        "medecins",
        sa.Column("ville", sa.String(100), nullable=True),
    )
    op.add_column(
        "medecins",
        sa.Column("district", sa.String(100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("medecins", "district")
    op.drop_column("medecins", "ville")
    op.drop_column("medecins", "structure_modification")
    op.drop_column("medecins", "tarif_modification")
    op.drop_column("medecins", "documents")
    op.drop_column("medecins", "experience_history")
    op.drop_column("medecins", "actes")
    op.drop_column("medecins", "expertises")
    op.drop_column("medecins", "presentation")
    op.drop_column("users", "date_naissance")
    op.drop_column("users", "adresse")
    op.drop_column("users", "timezone")
