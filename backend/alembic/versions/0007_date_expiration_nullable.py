"""Make date_expiration nullable

Revision ID: 0007_date_expiration_nullable
Revises: 0006_create_prise_medicaments
Create Date: 2026-07-13
"""
from alembic import op

revision = "0007_date_expiration_nullable"
down_revision = "0006_create_prise_medicaments"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("ordonnances", "date_expiration", nullable=True)


def downgrade() -> None:
    op.alter_column("ordonnances", "date_expiration", nullable=False)
