"""add methodes_retrait to medecins

Revision ID: 0015_add_methodes_retrait
Revises: 0014_conversations_demande_avis
Create Date: 2026-07-27
"""
from alembic import op
import sqlalchemy as sa

revision = "0015_add_methodes_retrait"
down_revision = "0014_conversations_demande_avis"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("medecins", sa.Column("methodes_retrait", sa.dialects.postgresql.JSONB(), nullable=True))


def downgrade():
    op.drop_column("medecins", "methodes_retrait")
