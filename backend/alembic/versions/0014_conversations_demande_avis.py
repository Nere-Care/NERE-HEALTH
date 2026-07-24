"""add demande_avis_id to conversations, make patient_id nullable

Revision ID: 0014_conversations_demande_avis
Revises: 0013_demandes_avis_medical
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa

revision = "0014_conversations_demande_avis"
down_revision = "0014_merge_heads"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("conversations", sa.Column("demande_avis_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("demandes_avis_medical.id"), nullable=True))
    op.alter_column("conversations", "patient_id", existing_type=sa.dialects.postgresql.UUID(as_uuid=True), nullable=True)
    op.create_index("ix_conversations_demande_avis_id", "conversations", ["demande_avis_id"], unique=False)


def downgrade():
    op.drop_index("ix_conversations_demande_avis_id", "conversations")
    op.drop_column("conversations", "demande_avis_id")
    op.alter_column("conversations", "patient_id", existing_type=sa.dialects.postgresql.UUID(as_uuid=True), nullable=False)
