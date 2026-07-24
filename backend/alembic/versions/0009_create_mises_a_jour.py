"""Create mises_a_jour table

Revision ID: 0009_create_mises_a_jour
Revises: 0008_rm_dup_fields
Create Date: 2026-07-16
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_create_mises_a_j"
down_revision = "0008_rm_dup_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mises_a_jour",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("titre", sa.String(255), nullable=False),
        sa.Column("contenu", sa.Text(), nullable=False),
        sa.Column("lien", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(10), server_default=sa.text("'🔔'")),
        sa.Column("est_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("mises_a_jour")
