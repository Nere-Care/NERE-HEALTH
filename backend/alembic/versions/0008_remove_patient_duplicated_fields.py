"""Remove duplicated fields from patients

Revision ID: 0008_rm_dup_fields
Revises: 0007_date_expiration_nullable
Create Date: 2026-07-16
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_rm_dup_fields"
down_revision = "0007_date_expiration_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("uq_patients_numero_patient", "patients", type_="unique")
    op.drop_column("patients", "numero_patient")
    op.drop_column("patients", "date_naissance")
    op.drop_column("patients", "adresse")
    op.drop_column("patients", "taille_cm")
    op.drop_column("patients", "poids_kg")
    op.drop_column("patients", "antecedents_medicaux")
    op.drop_column("patients", "medicaments_en_cours")


def downgrade() -> None:
    op.add_column("patients", sa.Column("numero_patient", sa.String(25), nullable=False))
    op.add_column("patients", sa.Column("date_naissance", sa.Date(), nullable=True))
    op.add_column("patients", sa.Column("adresse", sa.Text(), nullable=True))
    op.add_column("patients", sa.Column("taille_cm", sa.Numeric(5, 2), nullable=True))
    op.add_column("patients", sa.Column("poids_kg", sa.Numeric(5, 2), nullable=True))
    op.add_column("patients", sa.Column("antecedents_medicaux", sa.Text(), nullable=True))
    op.add_column("patients", sa.Column("medicaments_en_cours", sa.Text(), nullable=True))
    op.create_unique_constraint("uq_patients_numero_patient", "patients", ["numero_patient"])
