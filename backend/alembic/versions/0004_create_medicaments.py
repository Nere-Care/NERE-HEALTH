"""Create medicaments table

Revision ID: 0004_create_medicaments
Revises: 0003_drop_patients_allergies
Create Date: 2026-07-13

"""
import sqlalchemy as sa
from alembic import op

revision = "0004_create_medicaments"
down_revision = "0003_drop_patients_allergies"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "medicaments",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("nom_commercial", sa.String(300), nullable=False),
        sa.Column("dci", sa.String(300), nullable=False),
        sa.Column("dosage", sa.String(100), nullable=False),
        sa.Column("forme", sa.String(100), nullable=False),
        sa.Column("classe_therapeutique", sa.String(150), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_medicaments_nom_commercial", "medicaments", ["nom_commercial"])
    op.create_index("ix_medicaments_dci", "medicaments", ["dci"])
    op.create_index("ix_medicaments_classe_therapeutique", "medicaments", ["classe_therapeutique"])


def downgrade() -> None:
    op.drop_index("ix_medicaments_classe_therapeutique")
    op.drop_index("ix_medicaments_dci")
    op.drop_index("ix_medicaments_nom_commercial")
    op.drop_table("medicaments")
