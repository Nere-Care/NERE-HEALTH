"""add missing user/medecin columns to match models

Adds columns that exist in SQLAlchemy models but were never
added to the database via migration.
Uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS so the migration
is idempotent (create_all() may have already created them).

Revision ID: 0016_add_missing_user_medecin_columns
Revises: 0015_add_methodes_retrait
Create Date: 2026-07-29
"""
from alembic import op

revision = "0016_add_missing_user_medecin_columns"
down_revision = "0015_add_methodes_retrait"
branch_labels = None
depends_on = None


def _add(table: str, col: str, sql_type: str, nullable: bool = True, default: str | None = None):
    parts = [f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {sql_type}"]
    if not nullable:
        parts.append("NOT NULL")
    if default is not None:
        parts.append(f"DEFAULT {default}")
    op.execute(" ".join(parts))


def upgrade() -> None:
    _add("users", "timezone", "VARCHAR(50)", nullable=False, default="'Africa/Douala'")
    _add("users", "adresse", "TEXT")
    _add("users", "date_naissance", "DATE")

    _add("medecins", "presentation", "TEXT")
    _add("medecins", "expertises", "JSONB", nullable=False, default="'[]'::jsonb")
    _add("medecins", "actes", "JSONB", nullable=False, default="'[]'::jsonb")
    _add("medecins", "experience_history", "JSONB", nullable=False, default="'[]'::jsonb")
    _add("medecins", "documents", "JSONB", nullable=False, default="'[]'::jsonb")
    _add("medecins", "tarif_modification", "JSONB")
    _add("medecins", "structure_modification", "JSONB")
    _add("medecins", "ville", "VARCHAR(100)")
    _add("medecins", "district", "VARCHAR(100)")


def downgrade() -> None:
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS district")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS ville")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS structure_modification")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS tarif_modification")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS documents")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS experience_history")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS actes")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS expertises")
    op.execute("ALTER TABLE medecins DROP COLUMN IF EXISTS presentation")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS date_naissance")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS adresse")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS timezone")
