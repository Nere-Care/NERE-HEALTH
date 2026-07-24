"""Add equipements, langues_parlees, assurances to structures

Revision ID: 0002_add_structure_list_fields
Revises: 0001_initial
Create Date: 2026-07-09

"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_structure_list_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("structures", sa.Column("equipements", sa.ARRAY(sa.String()), nullable=False, server_default=sa.text("ARRAY[]::text[]")))
    op.add_column("structures", sa.Column("langues_parlees", sa.ARRAY(sa.String()), nullable=False, server_default=sa.text("ARRAY[]::text[]")))
    op.add_column("structures", sa.Column("assurances", sa.ARRAY(sa.String()), nullable=False, server_default=sa.text("ARRAY[]::text[]")))


def downgrade() -> None:
    op.drop_column("structures", "equipements")
    op.drop_column("structures", "langues_parlees")
    op.drop_column("structures", "assurances")
