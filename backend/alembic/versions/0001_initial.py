"""Initial Alembic baseline revision.

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-15 00:00:00.000000
"""

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'notifications' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_notifications_utilisateur_id'
                ) THEN
                    CREATE INDEX ix_notifications_utilisateur_id ON public.notifications (utilisateur_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_notifications_statut'
                ) THEN
                    CREATE INDEX ix_notifications_statut ON public.notifications (statut);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'rendez_vous' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_rendez_vous_patient_id'
                ) THEN
                    CREATE INDEX ix_rendez_vous_patient_id ON public.rendez_vous (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_rendez_vous_medecin_id'
                ) THEN
                    CREATE INDEX ix_rendez_vous_medecin_id ON public.rendez_vous (medecin_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_rendez_vous_structure_id'
                ) THEN
                    CREATE INDEX ix_rendez_vous_structure_id ON public.rendez_vous (structure_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_rendez_vous_date_heure_debut'
                ) THEN
                    CREATE INDEX ix_rendez_vous_date_heure_debut ON public.rendez_vous (date_heure_debut);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'consultations' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_consultations_patient_id'
                ) THEN
                    CREATE INDEX ix_consultations_patient_id ON public.consultations (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_consultations_medecin_id'
                ) THEN
                    CREATE INDEX ix_consultations_medecin_id ON public.consultations (medecin_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_consultations_rdv_id'
                ) THEN
                    CREATE INDEX ix_consultations_rdv_id ON public.consultations (rdv_id);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'ordonnances' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_ordonnances_consultation_id'
                ) THEN
                    CREATE INDEX ix_ordonnances_consultation_id ON public.ordonnances (consultation_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_ordonnances_patient_id'
                ) THEN
                    CREATE INDEX ix_ordonnances_patient_id ON public.ordonnances (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_ordonnances_medecin_id'
                ) THEN
                    CREATE INDEX ix_ordonnances_medecin_id ON public.ordonnances (medecin_id);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'paiements' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_paiements_rdv_id'
                ) THEN
                    CREATE INDEX ix_paiements_rdv_id ON public.paiements (rdv_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_paiements_patient_id'
                ) THEN
                    CREATE INDEX ix_paiements_patient_id ON public.paiements (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_paiements_medecin_id'
                ) THEN
                    CREATE INDEX ix_paiements_medecin_id ON public.paiements (medecin_id);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'avis' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_avis_patient_id'
                ) THEN
                    CREATE INDEX ix_avis_patient_id ON public.avis (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_avis_medecin_id'
                ) THEN
                    CREATE INDEX ix_avis_medecin_id ON public.avis (medecin_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_avis_rdv_id'
                ) THEN
                    CREATE INDEX ix_avis_rdv_id ON public.avis (rdv_id);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'chatbot_sessions' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_chatbot_sessions_patient_id'
                ) THEN
                    CREATE INDEX ix_chatbot_sessions_patient_id ON public.chatbot_sessions (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_chatbot_sessions_medecin_id'
                ) THEN
                    CREATE INDEX ix_chatbot_sessions_medecin_id ON public.chatbot_sessions (medecin_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_chatbot_sessions_rdv_cree_id'
                ) THEN
                    CREATE INDEX ix_chatbot_sessions_rdv_cree_id ON public.chatbot_sessions (rdv_cree_id);
                END IF;
            END IF;

            IF EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON c.relnamespace = n.oid
                WHERE c.relname = 'conversations' AND n.nspname = 'public'
            ) THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_conversations_patient_id'
                ) THEN
                    CREATE INDEX ix_conversations_patient_id ON public.conversations (patient_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_conversations_medecin_id'
                ) THEN
                    CREATE INDEX ix_conversations_medecin_id ON public.conversations (medecin_id);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes
                    WHERE schemaname = 'public' AND indexname = 'ix_conversations_rdv_id'
                ) THEN
                    CREATE INDEX ix_conversations_rdv_id ON public.conversations (rdv_id);
                END IF;
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DROP INDEX IF EXISTS public.ix_notifications_utilisateur_id;
        DROP INDEX IF EXISTS public.ix_notifications_statut;
        DROP INDEX IF EXISTS public.ix_rendez_vous_patient_id;
        DROP INDEX IF EXISTS public.ix_rendez_vous_medecin_id;
        DROP INDEX IF EXISTS public.ix_rendez_vous_structure_id;
        DROP INDEX IF EXISTS public.ix_rendez_vous_date_heure_debut;
        DROP INDEX IF EXISTS public.ix_consultations_patient_id;
        DROP INDEX IF EXISTS public.ix_consultations_medecin_id;
        DROP INDEX IF EXISTS public.ix_consultations_rdv_id;
        DROP INDEX IF EXISTS public.ix_ordonnances_consultation_id;
        DROP INDEX IF EXISTS public.ix_ordonnances_patient_id;
        DROP INDEX IF EXISTS public.ix_ordonnances_medecin_id;
        DROP INDEX IF EXISTS public.ix_paiements_rdv_id;
        DROP INDEX IF EXISTS public.ix_paiements_patient_id;
        DROP INDEX IF EXISTS public.ix_paiements_medecin_id;
        DROP INDEX IF EXISTS public.ix_avis_patient_id;
        DROP INDEX IF EXISTS public.ix_avis_medecin_id;
        DROP INDEX IF EXISTS public.ix_avis_rdv_id;
        DROP INDEX IF EXISTS public.ix_chatbot_sessions_patient_id;
        DROP INDEX IF EXISTS public.ix_chatbot_sessions_medecin_id;
        DROP INDEX IF EXISTS public.ix_chatbot_sessions_rdv_cree_id;
        DROP INDEX IF EXISTS public.ix_conversations_patient_id;
        DROP INDEX IF EXISTS public.ix_conversations_medecin_id;
        DROP INDEX IF EXISTS public.ix_conversations_rdv_id;
        """
    )
