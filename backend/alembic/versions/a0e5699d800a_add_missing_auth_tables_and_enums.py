"""add_missing_auth_tables_and_enums
Revision ID: a0e5699d800a
Revises: 854a93350b2e
Create Date: 2026-04-26 10:54:52.931066
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a0e5699d800a'
down_revision = '854a93350b2e'
branch_labels = None
depends_on = None




def upgrade():
    # Créer les types ENUM manquants seulement s'ils n'existent pas
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'token_revoke_reason'
            ) THEN
                CREATE TYPE token_revoke_reason AS ENUM (
                    'logout',
                    'suspicion',
                    'admin_revoke',
                    'password_change',
                    'expired'
                );
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'token_rotation_reason'
            ) THEN
                CREATE TYPE token_rotation_reason AS ENUM (
                    'proactive',
                    'expiration',
                    'suspicion',
                    'manual'
                );
            END IF;
        END
        $$;
    """)

    # Créer les index pour chatbot_sessions seulement s'ils n'existent pas
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'ix_chatbot_sessions_medecin_id'
            ) THEN
                CREATE INDEX ix_chatbot_sessions_medecin_id
                    ON public.chatbot_sessions (medecin_id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'ix_chatbot_sessions_patient_id'
            ) THEN
                CREATE INDEX ix_chatbot_sessions_patient_id
                    ON public.chatbot_sessions (patient_id);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                  AND indexname = 'ix_chatbot_sessions_rdv_cree_id'
            ) THEN
                CREATE INDEX ix_chatbot_sessions_rdv_cree_id
                    ON public.chatbot_sessions (rdv_cree_id);
            END IF;
        END
        $$;
    """)

    # Créer la table token_blacklist seulement si elle n'existe pas
    op.execute("""
        CREATE TABLE IF NOT EXISTS token_blacklist (
            id SERIAL PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            user_id UUID NOT NULL,
            reason token_revoke_reason NOT NULL DEFAULT 'logout',
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # Créer les index pour token_blacklist
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_token_blacklist_expires_at ON token_blacklist (expires_at);
        CREATE INDEX IF NOT EXISTS ix_token_blacklist_user_id ON token_blacklist (user_id);
        CREATE INDEX IF NOT EXISTS ix_token_blacklist_token ON token_blacklist (token);
    """)

    # Créer la table token_rotation_logs seulement si elle n'existe pas
    op.execute("""
        CREATE TABLE IF NOT EXISTS token_rotation_logs (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            old_token_hash VARCHAR(64) NOT NULL,
            new_token_hash VARCHAR(64) NOT NULL,
            rotation_reason token_rotation_reason NOT NULL,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    # Créer les index pour token_rotation_logs
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_token_rotation_logs_user_id ON token_rotation_logs (user_id);
        CREATE INDEX IF NOT EXISTS ix_token_rotation_logs_created_at ON token_rotation_logs (created_at);
    """)

    # Ajouter la contrainte de clé étrangère seulement si elle n'existe pas
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_chatbot_sessions_medecin_id'
            ) THEN
                ALTER TABLE chatbot_sessions
                ADD CONSTRAINT fk_chatbot_sessions_medecin_id
                FOREIGN KEY (medecin_id) REFERENCES medecins (id) ON DELETE SET NULL;
            END IF;
        END
        $$;
    """)


def downgrade():
    # Supprimer la contrainte de clé étrangère
    op.drop_constraint('fk_chatbot_sessions_medecin_id', 'chatbot_sessions', type_='foreignkey')

    # Supprimer les index pour token_rotation_logs
    op.drop_index('ix_token_rotation_logs_created_at', table_name='token_rotation_logs')
    op.drop_index('ix_token_rotation_logs_user_id', table_name='token_rotation_logs')

    # Supprimer la table token_rotation_logs
    op.drop_table('token_rotation_logs')

    # Supprimer les index pour token_blacklist
    op.drop_index('ix_token_blacklist_token', table_name='token_blacklist')
    op.drop_index('ix_token_blacklist_user_id', table_name='token_blacklist')
    op.drop_index('ix_token_blacklist_expires_at', table_name='token_blacklist')

    # Supprimer la table token_blacklist
    op.drop_table('token_blacklist')

    # Supprimer les index pour chatbot_sessions
    op.drop_index('ix_chatbot_sessions_rdv_cree_id', table_name='chatbot_sessions')
    op.drop_index('ix_chatbot_sessions_patient_id', table_name='chatbot_sessions')
    op.drop_index('ix_chatbot_sessions_medecin_id', table_name='chatbot_sessions')

    # Supprimer la colonne medecin_id
    op.drop_column('chatbot_sessions', 'medecin_id')

    # Supprimer les types ENUM
    token_rotation_reason = postgresql.ENUM('proactive', 'expiration', 'suspicion', 'manual', name='token_rotation_reason')
    token_rotation_reason.drop(op.get_bind(), checkfirst=True)

    token_revoke_reason = postgresql.ENUM('logout', 'suspicion', 'admin_revoke', 'password_change', 'expired', name='token_revoke_reason')
    token_revoke_reason.drop(op.get_bind(), checkfirst=True)
