-- Script de correction des manquements PostgreSQL pour NERE
-- Exécuter dans l'ordre pour éviter les dépendances
-- 1. Créer les types ENUM manquants
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'token_revoke_reason'
) THEN CREATE TYPE token_revoke_reason AS ENUM (
  'logout',
  'suspicion',
  'admin_revoke',
  'password_change',
  'expired'
);
END IF;
IF NOT EXISTS (
  SELECT 1
  FROM pg_type
  WHERE typname = 'token_rotation_reason'
) THEN CREATE TYPE token_rotation_reason AS ENUM (
  'proactive',
  'expiration',
  'suspicion',
  'manual'
);
END IF;
END $$;
-- 2. Ajouter la colonne manquante à chatbot_sessions
ALTER TABLE chatbot_sessions
ADD COLUMN IF NOT EXISTS medecin_id UUID;
-- 3. Créer les index manquants pour chatbot_sessions
CREATE INDEX IF NOT EXISTS ix_chatbot_sessions_medecin_id ON chatbot_sessions (medecin_id);
CREATE INDEX IF NOT EXISTS ix_chatbot_sessions_patient_id ON chatbot_sessions (patient_id);
CREATE INDEX IF NOT EXISTS ix_chatbot_sessions_rdv_cree_id ON chatbot_sessions (rdv_cree_id);
-- 4. Créer la table token_blacklist
CREATE TABLE IF NOT EXISTS token_blacklist (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  reason token_revoke_reason NOT NULL DEFAULT 'logout',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- 5. Créer les index pour token_blacklist
CREATE INDEX IF NOT EXISTS ix_token_blacklist_expires_at ON token_blacklist (expires_at);
CREATE INDEX IF NOT EXISTS ix_token_blacklist_user_id ON token_blacklist (user_id);
CREATE INDEX IF NOT EXISTS ix_token_blacklist_token ON token_blacklist (token);
-- 6. Créer la table token_rotation_logs
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
-- 7. Créer les index pour token_rotation_logs
CREATE INDEX IF NOT EXISTS ix_token_rotation_logs_user_id ON token_rotation_logs (user_id);
CREATE INDEX IF NOT EXISTS ix_token_rotation_logs_created_at ON token_rotation_logs (created_at);
-- 8. Ajouter la contrainte de clé étrangère pour chatbot_sessions
ALTER TABLE chatbot_sessions
ADD CONSTRAINT IF NOT EXISTS fk_chatbot_sessions_medecin_id FOREIGN KEY (medecin_id) REFERENCES medecins (id) ON DELETE
SET NULL;
-- 9. Créer la table alembic_version si elle n'existe pas et insérer la version
CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL);
INSERT INTO alembic_version (version_num)
VALUES ('854a93350b2e') ON CONFLICT DO NOTHING;
