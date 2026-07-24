"""add code_medecin to medecins

Revision ID: 0010_add_code_mede
Revises: 0008_rm_dup_fields
Create Date: 2026-07-17
"""
from alembic import op
import sqlalchemy as sa

revision = "0010_add_code_mede"
down_revision = "0008_rm_dup_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "medecins",
        sa.Column("code_medecin", sa.String(20), nullable=False, server_default="MED-00000000"),
    )
    op.create_unique_constraint("uq_medecins_code_medecin", "medecins", ["code_medecin"])


def downgrade() -> None:
    op.drop_constraint("uq_medecins_code_medecin", "medecins", type_="unique")
    op.drop_column("medecins", "code_medecin")
