"""Drop allergies column from patients table

Revision ID: 0003_drop_patients_allergies
Revises: 0002_add_structure_list_fields
Create Date: 2026-07-12

"""
import sqlalchemy as sa
from alembic import op

revision = "0003_drop_patients_allergies"
down_revision = "0002_add_structure_list_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("patients", "allergies")


def downgrade() -> None:
    op.add_column("patients", sa.Column("allergies", sa.ARRAY(sa.Text()), nullable=True))
