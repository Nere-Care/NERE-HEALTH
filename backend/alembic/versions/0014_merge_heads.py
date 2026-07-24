"""merge heads

Revision ID: 0014_merge_heads
Revises: 0009_create_mises_a_j, 0013_demandes_avis_medical
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa

revision = "0014_merge_heads"
down_revision = ("0009_create_mises_a_j", "0013_demandes_avis_medical")
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
