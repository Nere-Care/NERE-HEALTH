"""Create prise_medicaments table

Revision ID: 0006_create_prise_medicaments
Revises: 0005_add_traitement_fields
Create Date: 2026-07-13
"""
import sqlalchemy as sa
from alembic import op

revision = "0006_create_prise_medicaments"
down_revision = "0005_add_traitement_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE moment_journee_prise AS ENUM ('MATIN', 'MIDI', 'SOIR')")
    op.execute("CREATE TYPE statut_prise AS ENUM ('A_PRENDRE', 'PRIS', 'OUBLIE')")

    op.create_table(
        "prise_medicaments",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("ordonnance_id", sa.UUID(), sa.ForeignKey("ordonnances.id", ondelete="CASCADE"), nullable=False),
        sa.Column("medicament_nom", sa.String(300), nullable=False),
        sa.Column("date_prise_prevue", sa.Date(), nullable=False),
        sa.Column("heure_prise_prevue", sa.Time(), nullable=True),
        sa.Column(
            "moment_journee",
            sa.Enum("MATIN", "MIDI", "SOIR", name="moment_journee_prise", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "statut",
            sa.Enum("A_PRENDRE", "PRIS", "OUBLIE", name="statut_prise", create_type=False),
            nullable=False,
            server_default=sa.text("'A_PRENDRE'::public.statut_prise"),
        ),
        sa.Column("date_prise_effective", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_prise_medicaments_ordonnance_id", "prise_medicaments", ["ordonnance_id"])
    op.create_index("ix_prise_medicaments_date_prise_prevue", "prise_medicaments", ["date_prise_prevue"])


def downgrade() -> None:
    op.drop_index("ix_prise_medicaments_date_prise_prevue")
    op.drop_index("ix_prise_medicaments_ordonnance_id")
    op.drop_table("prise_medicaments")
    op.execute("DROP TYPE statut_prise")
    op.execute("DROP TYPE moment_journee_prise")
