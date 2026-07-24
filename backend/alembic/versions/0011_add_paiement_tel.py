"""add paiement telephone and last4

Revision ID: 0011_add_paiement_tel
Revises: 0010_add_code_mede
Create Date: 2026-07-17
"""
from alembic import op
import sqlalchemy as sa

revision = "0011_add_paiement_tel"
down_revision = "0010_add_code_mede"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("paiements", sa.Column("telephone_paiement", sa.String(20), nullable=True))
    op.add_column("paiements", sa.Column("derniers_4_chiffres", sa.String(4), nullable=True))


def downgrade() -> None:
    op.drop_column("paiements", "derniers_4_chiffres")
    op.drop_column("paiements", "telephone_paiement")
