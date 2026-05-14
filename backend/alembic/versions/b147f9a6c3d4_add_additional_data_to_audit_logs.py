"""Add additional_data column to audit_logs
Revision ID: b147f9a6c3d4
Revises: a0e5699d800a
Create Date: 2026-05-13 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b147f9a6c3d4"
down_revision = "a0e5699d800a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "audit_logs",
        sa.Column(
            "additional_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("audit_logs", "additional_data")
