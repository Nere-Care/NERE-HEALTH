"""demandes d'avis médical + localisation médecin

Revision ID: 0013_demandes_avis_medical
Revises: 0012_privacy_fields
Create Date: 2026-07-19
"""
from alembic import op
import sqlalchemy as sa

revision = "0013_demandes_avis_medical"
down_revision = "0012_privacy_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE portee_enum AS ENUM ('cameroun', 'diaspora')")
    op.execute("CREATE TYPE statut_demande_avis AS ENUM ('en_attente', 'acceptee', 'refusee', 'annulee')")

    op.add_column("medecins", sa.Column("ville", sa.String(100), nullable=True))
    op.add_column("medecins", sa.Column("district", sa.String(100), nullable=True))

    op.execute("ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'demande_avis_recue'")
    op.execute("ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'demande_avis_acceptee'")
    op.execute("ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'demande_avis_refusee'")
    op.execute("ALTER TYPE type_notification ADD VALUE IF NOT EXISTS 'demande_avis_repondu'")

    op.create_table(
        "demandes_avis_medical",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("medecin_demandeur_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("medecins.id"), nullable=False),
        sa.Column("patient_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("patients.id"), nullable=False),
        sa.Column("specialite_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("specialites.id"), nullable=False),
        sa.Column("portee", sa.dialects.postgresql.ENUM("cameroun", "diaspora", name="portee_enum", create_type=False), nullable=False),
        sa.Column("consultation_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("consultations.id"), nullable=True),
        sa.Column("dossier_medical_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("dossiers_medicaux.id"), nullable=True),
        sa.Column("motif", sa.Text(), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("statut", sa.dialects.postgresql.ENUM("en_attente", "acceptee", "refusee", "annulee", name="statut_demande_avis", create_type=False), nullable=False, server_default=sa.text("'en_attente'::public.statut_demande_avis")),
        sa.Column("medecin_accepteur_id", sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey("medecins.id"), nullable=True),
        sa.Column("reponse", sa.Text(), nullable=True),
        sa.Column("date_reponse", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confidentiel", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    op.create_index("ix_demandes_avis_medical_medecin_demandeur_id", "demandes_avis_medical", ["medecin_demandeur_id"])
    op.create_index("ix_demandes_avis_medical_medecin_accepteur_id", "demandes_avis_medical", ["medecin_accepteur_id"])
    op.create_index("ix_demandes_avis_medical_specialite_id", "demandes_avis_medical", ["specialite_id"])
    op.create_index("ix_demandes_avis_medical_statut", "demandes_avis_medical", ["statut"])


def downgrade() -> None:
    op.drop_index("ix_demandes_avis_medical_statut")
    op.drop_index("ix_demandes_avis_medical_specialite_id")
    op.drop_index("ix_demandes_avis_medical_medecin_accepteur_id")
    op.drop_index("ix_demandes_avis_medical_medecin_demandeur_id")
    op.drop_table("demandes_avis_medical")
    op.execute("ALTER TYPE type_notification DROP VALUE IF EXISTS 'demande_avis_repondu'")
    op.execute("ALTER TYPE type_notification DROP VALUE IF EXISTS 'demande_avis_refusee'")
    op.execute("ALTER TYPE type_notification DROP VALUE IF EXISTS 'demande_avis_acceptee'")
    op.execute("ALTER TYPE type_notification DROP VALUE IF EXISTS 'demande_avis_recue'")
    op.drop_column("medecins", "district")
    op.drop_column("medecins", "ville")
    op.execute("DROP TYPE statut_demande_avis")
    op.execute("DROP TYPE portee_enum")
