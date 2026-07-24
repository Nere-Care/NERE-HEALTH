"""add privacy fields

Revision ID: 0012_privacy_fields
Revises: 0011_add_paiement_tel
Create Date: 2026-07-18
"""
from alembic import op
import sqlalchemy as sa

revision = "0012_privacy_fields"
down_revision = "0011_add_paiement_tel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE acces_dossier_enum AS ENUM ('standard', 'restreint')")
    op.add_column("patients", sa.Column("acces_dossier", sa.Text(), server_default="standard", nullable=False))
    op.add_column("patients", sa.Column("partage_anonyme", sa.Boolean(), server_default=sa.text("true"), nullable=False))

    op.create_table(
        "professionnels_autorises",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("patient_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("medecin_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("patient_id", "medecin_id", name="uq_professionnels_autorises"),
    )
    op.create_index("ix_professionnels_autorises_patient_id", "professionnels_autorises", ["patient_id"])


def downgrade() -> None:
    op.drop_index("ix_professionnels_autorises_patient_id")
    op.drop_table("professionnels_autorises")
    op.drop_column("patients", "partage_anonyme")
    op.drop_column("patients", "acces_dossier")
    op.execute("DROP TYPE acces_dossier_enum")
