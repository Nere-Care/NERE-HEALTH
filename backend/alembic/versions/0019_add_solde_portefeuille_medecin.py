"""add solde_portefeuille to medecins

Revision ID: 0019_add_solde_portefeuille
Revises: 0018_add_patients_proches_json
Create Date: 2026-08-21
"""
from alembic import op
import sqlalchemy as sa

revision = "0019_add_solde_portefeuille"
down_revision = "0018_add_patients_proches_json"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "medecins",
        sa.Column("solde_portefeuille", sa.Numeric(12, 2), server_default="0.00", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("medecins", "solde_portefeuille")
