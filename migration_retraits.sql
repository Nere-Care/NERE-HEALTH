-- Migration: Create retraits table
-- Run: docker compose exec db psql -U nere_user -d nere_db -f /docker-entrypoint-initdb.d/20260724_retraits.sql

CREATE TYPE IF NOT EXISTS statut_retrait AS ENUM ('en_attente', 'valide', 'rejete', 'effectue');
CREATE TYPE IF NOT EXISTS devise_enum_retrait AS ENUM ('XAF', 'EUR', 'USD', 'GBP', 'XOF');

CREATE TABLE IF NOT EXISTS retraits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id UUID NOT NULL REFERENCES users(id),
    montant NUMERIC(10,2) NOT NULL,
    devise devise_enum_retrait NOT NULL DEFAULT 'XAF',
    methode VARCHAR(50) NOT NULL,
    statut statut_retrait NOT NULL DEFAULT 'en_attente',
    reference VARCHAR(200),
    motif_rejet TEXT,
    admin_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_retraits_medecin_id ON retraits(medecin_id);
CREATE INDEX IF NOT EXISTS ix_retraits_statut ON retraits(statut);
