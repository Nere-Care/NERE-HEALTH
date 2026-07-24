"""Add treatment tracking fields to ordonnances

Revision ID: 0005_add_traitement_fields
Revises: 726b9fe16931
Create Date: 2026-07-13
"""
import sqlalchemy as sa
from alembic import op

revision = "0005_add_traitement_fields"
down_revision = "726b9fe16931"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE statut_traitement AS ENUM ('EN_COURS', 'TERMINE', 'ARRETE')")
    op.add_column("ordonnances", sa.Column("date_debut_traitement", sa.Date(), nullable=True))
    op.add_column("ordonnances", sa.Column(
        "statut_traitement",
        sa.Enum("EN_COURS", "TERMINE", "ARRETE", name="statut_traitement"),
        nullable=True,
    ))
    op.add_column("ordonnances", sa.Column("date_arret_traitement", sa.Date(), nullable=True))
    op.add_column("ordonnances", sa.Column("motif_arret_traitement", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("ordonnances", "motif_arret_traitement")
    op.drop_column("ordonnances", "date_arret_traitement")
    op.drop_column("ordonnances", "statut_traitement")
    op.drop_column("ordonnances", "date_debut_traitement")
    op.execute("DROP TYPE statut_traitement")
