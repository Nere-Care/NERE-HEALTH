"""add proches jsonb column to patients

Revision ID: 0018_add_patients_proches_json
Revises: 0017_email_verification
Create Date: 2026-08-19
"""
from alembic import op

revision = "0018_add_patients_proches_json"
down_revision = "0017_email_verification"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE patients ADD COLUMN IF NOT EXISTS proches JSONB DEFAULT '[]'::jsonb")


def downgrade() -> None:
    op.execute("ALTER TABLE patients DROP COLUMN IF EXISTS proches")
