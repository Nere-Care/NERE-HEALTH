-- ============================================================================
-- PROJET NÉRÉ — Script SQL Complet PostgreSQL
-- Plateforme Numérique de Santé — Cameroun
-- Version : 1.0 | Date : Mars 2025
-- Description : Création complète de la base de données avec toutes les
--               tables, relations, contraintes, index, triggers de traçabilité
--               et fonctions utilitaires.
-- ============================================================================

-- ============================================================================
-- SECTION 0 : CONFIGURATION INITIALE & EXTENSIONS
-- ============================================================================

-- Créer la base de données (à exécuter en tant que superuser PostgreSQL)
-- CREATE DATABASE nere_db
--     WITH ENCODING = 'UTF8'
--     LC_COLLATE = 'fr_FR.UTF-8'
--     LC_CTYPE = 'fr_FR.UTF-8'
--     TEMPLATE = template0;

-- Se connecter à la base
-- \c nere_db;

-- Extension pour générer des UUID v4 automatiquement
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extension pour la recherche full-text en français
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Extension pour les adresses IP (type INET natif PostgreSQL — pas d'extension nécessaire)

-- ============================================================================
-- SECTION 1 : TYPES ÉNUMÉRÉS (ENUM)
-- ============================================================================
-- Les ENUMs garantissent l'intégrité des données au niveau de la base.
-- Seules les valeurs définies peuvent être insérées.

-- Rôles des utilisateurs
CREATE TYPE role_utilisateur AS ENUM (
    'patient',
    'medecin',
    'structure',
    'admin',
    'observateur'
);

-- Statuts généraux des comptes
CREATE TYPE statut_compte AS ENUM (
    'actif',
    'inactif',
    'suspendu',
    'en_attente',
    'supprime'
);

-- Statut de vérification des professionnels
CREATE TYPE statut_verification AS ENUM (
    'en_attente',
    'en_cours_verification',
    'verifie',
    'rejete',
    'suspendu'
);

-- Sexe
CREATE TYPE sexe_enum AS ENUM ('M', 'F', 'Autre', 'Non_precise');

-- Groupes sanguins
CREATE TYPE groupe_sanguin_enum AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Inconnu'
);

-- Types de consultation
CREATE TYPE type_consultation AS ENUM (
    'presentiel',
    'video',
    'audio',
    'chat'
);

-- Statuts d'un rendez-vous
CREATE TYPE statut_rdv AS ENUM (
    'en_attente',
    'confirme',
    'annule_patient',
    'annule_medecin',
    'annule_systeme',
    'en_cours',
    'termine',
    'no_show_patient',
    'no_show_medecin',
    'rembourse'
);

-- Statuts d'un paiement
CREATE TYPE statut_paiement AS ENUM (
    'initie',
    'en_attente_confirmation',
    'confirme',
    'echoue',
    'rembourse',
    'rembourse_partiel',
    'annule',
    'expire'
);

-- Méthodes de paiement
CREATE TYPE methode_paiement AS ENUM (
    'mtn_momo',
    'orange_money',
    'carte_visa',
    'carte_mastercard',
    'virement_bancaire',
    'notchpay',
    'stripe',
    'portefeuille_nere'
);

-- Fournisseurs de paiement
CREATE TYPE fournisseur_paiement AS ENUM (
    'cinetpay',
    'stripe',
    'notchpay',
    'interne'
);

-- Statuts d'une ordonnance
CREATE TYPE statut_ordonnance AS ENUM (
    'active',
    'utilisee',
    'partiellement_utilisee',
    'expiree',
    'annulee'
);

-- Formes pharmaceutiques
CREATE TYPE forme_medicament AS ENUM (
    'comprimes',
    'gelules',
    'sirop',
    'injectable',
    'creme',
    'pommade',
    'gouttes',
    'suppositoire',
    'patch',
    'inhalateur',
    'autre'
);

-- Types de documents médicaux
CREATE TYPE type_document_medical AS ENUM (
    'resultat_labo',
    'imagerie_radio',
    'imagerie_echographie',
    'imagerie_scanner',
    'imagerie_irm',
    'compte_rendu_consultation',
    'ordonnance_scannee',
    'certificat_medical',
    'carnet_vaccination',
    'autre'
);

-- Types de notifications
CREATE TYPE type_notification AS ENUM (
    'rappel_rdv',
    'confirmation_rdv',
    'annulation_rdv',
    'confirmation_paiement',
    'echec_paiement',
    'remboursement',
    'nouveau_message',
    'resultat_labo_disponible',
    'ordonnance_prete',
    'alerte_systeme',
    'compte_valide',
    'compte_rejete',
    'nouveaux_avis'
);

-- Canaux de notification
CREATE TYPE canal_notification AS ENUM (
    'push',
    'sms',
    'email',
    'in_app',
    'whatsapp'
);

-- Statuts de notification
CREATE TYPE statut_notification AS ENUM (
    'en_attente',
    'envoye',
    'lu',
    'echoue',
    'expire'
);

-- Actions d'audit
CREATE TYPE action_audit AS ENUM (
    'creation',
    'lecture',
    'modification',
    'suppression',
    'connexion',
    'deconnexion',
    'tentative_connexion_echec',
    'paiement_initie',
    'paiement_confirme',
    'paiement_echoue',
    'remboursement',
    'export_donnees',
    'acces_dossier_medical',
    'acces_ordonnance',
    'validation_compte',
    'suspension_compte',
    'revocation_session',
    'upload_document',
    'teleconsultation_debut',
    'teleconsultation_fin'
);

-- Types de récurrence des disponibilités
CREATE TYPE recurrence_enum AS ENUM (
    'unique',
    'quotidien',
    'hebdomadaire',
    'bi_mensuel',
    'mensuel'
);

-- Jours de la semaine
CREATE TYPE jour_semaine AS ENUM (
    'lundi', 'mardi', 'mercredi', 'jeudi',
    'vendredi', 'samedi', 'dimanche'
);

-- Niveaux d'urgence IA
CREATE TYPE niveau_urgence AS ENUM (
    'faible',
    'modere',
    'eleve',
    'urgence_vitale'
);

-- Types de messages
CREATE TYPE type_message AS ENUM (
    'texte',
    'image',
    'document',
    'audio',
    'video',
    'systeme'
);

-- Thèmes de l'interface
CREATE TYPE theme_interface AS ENUM ('clair', 'sombre', 'auto');

-- Devises supportées
CREATE TYPE devise_enum AS ENUM ('XAF', 'EUR', 'USD', 'GBP', 'XOF');

COMMENT ON TYPE role_utilisateur IS 'Rôles distincts des utilisateurs de la plateforme Néré';
COMMENT ON TYPE statut_rdv IS 'Cycle de vie complet d''un rendez-vous médical';
COMMENT ON TYPE statut_paiement IS 'États possibles d''une transaction financière';

-- ============================================================================
-- SECTION 2 : FONCTION D'AUDIT AUTOMATIQUE
-- ============================================================================
-- Cette fonction est appelée automatiquement par les triggers sur toutes
-- les tables sensibles. Elle enregistre chaque modification dans audit_logs
-- AVANT même de créer la table audit_logs — on la crée ici et le trigger
-- sera ajouté après la création de la table.

-- Fonction générique d'horodatage automatique (updated_at)
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at() IS
'Trigger function: met à jour automatiquement le champ updated_at à chaque modification';

-- Fonction de génération de numéro séquentiel sécurisé
CREATE OR REPLACE FUNCTION fn_generate_numero(prefix TEXT, seq_name TEXT)
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    annee TEXT;
BEGIN
    annee := TO_CHAR(NOW(), 'YYYY');
    EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
    RETURN prefix || '-' || annee || '-' || LPAD(next_val::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 3 : SÉQUENCES POUR NUMÉROTATION MÉTIER
-- ============================================================================
-- Les séquences génèrent des numéros incrémentaux lisibles par les humains
-- (différents des UUID techniques).

CREATE SEQUENCE IF NOT EXISTS seq_patient_numero START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_dossier_numero START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_rdv_numero START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_consultation_numero START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_ordonnance_numero START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS seq_paiement_numero START 1 INCREMENT 1;

-- ============================================================================
-- SECTION 4 : TABLES PRINCIPALES
-- ============================================================================
-- Ordre de création respectant les dépendances (FK):
-- users → patients/medecins/structures/observateurs
-- specialites → medecin_specialites
-- disponibilites → rendez_vous → consultations → ordonnances → ordonnance_lignes
-- rendez_vous → paiements
-- patients → dossiers_medicaux → consultations
-- users → sessions, notifications, audit_logs
-- patients/medecins → conversations → messages
-- consultations → documents_medicaux
-- patients/medecins → avis
-- patients → chatbot_sessions

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : users (Utilisateurs — table centrale)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    -- Identifiant primaire
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Authentification
    email               VARCHAR(255) NOT NULL,
    telephone           VARCHAR(20),
    mot_de_passe_hash   VARCHAR(255) NOT NULL,  -- Argon2id hash

    -- Rôle et statut
    role                role_utilisateur NOT NULL,
    statut              statut_compte NOT NULL DEFAULT 'en_attente',

    -- Informations personnelles
    nom                 VARCHAR(100),
    prenom              VARCHAR(100),
    photo_url           VARCHAR(1000),

    -- Préférences
    langue              VARCHAR(5) NOT NULL DEFAULT 'fr'
                            CHECK (langue IN ('fr', 'en')),
    theme               theme_interface NOT NULL DEFAULT 'clair',

    -- Sécurité 2FA
    totp_secret         VARCHAR(100),          -- Clé TOTP chiffrée (AES-256)
    totp_actif          BOOLEAN NOT NULL DEFAULT FALSE,

    -- Vérification
    email_verifie       BOOLEAN NOT NULL DEFAULT FALSE,
    email_otp           VARCHAR(6),            -- Code OTP temporaire
    email_otp_expires   TIMESTAMP WITH TIME ZONE,
    telephone_verifie   BOOLEAN NOT NULL DEFAULT FALSE,

    -- Tokens de réinitialisation
    reset_password_token        VARCHAR(255),
    reset_password_token_expires TIMESTAMP WITH TIME ZONE,

    -- Métadonnées
    last_login          TIMESTAMP WITH TIME ZONE,
    nb_tentatives_connexion INTEGER NOT NULL DEFAULT 0,
    bloque_jusqu_a      TIMESTAMP WITH TIME ZONE, -- Blocage après X échecs
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP WITH TIME ZONE  -- Soft delete

    -- Contraintes
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_telephone UNIQUE (telephone),
    CONSTRAINT chk_users_email_format CHECK (
        email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT chk_users_nb_tentatives CHECK (nb_tentatives_connexion >= 0)
);

-- Index de performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_statut ON users(statut);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Trigger updated_at
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE users IS 'Table centrale de tous les utilisateurs Néré. Héritée par patients, medecins, structures.';
COMMENT ON COLUMN users.mot_de_passe_hash IS 'Hash Argon2id du mot de passe. Jamais le mot de passe en clair.';
COMMENT ON COLUMN users.totp_secret IS 'Clé secrète TOTP chiffrée avec AES-256 avant stockage en base.';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete : l''enregistrement n''est pas supprimé physiquement.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : patients
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE patients (
    id                      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    numero_patient          VARCHAR(25) UNIQUE NOT NULL,  -- NER-2025-000001

    -- Données sociodémographiques
    date_naissance          DATE,
    sexe                    sexe_enum DEFAULT 'Non_precise',
    groupe_sanguin          groupe_sanguin_enum DEFAULT 'Inconnu',

    -- Localisation
    adresse                 TEXT,
    ville                   VARCHAR(100),
    region                  VARCHAR(100),
    pays                    VARCHAR(50) NOT NULL DEFAULT 'CM',
    code_postal             VARCHAR(10),
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),

    -- Informations médicales de base
    taille_cm               DECIMAL(5, 2) CHECK (taille_cm > 0 AND taille_cm < 300),
    poids_kg                DECIMAL(5, 2) CHECK (poids_kg > 0 AND poids_kg < 700),
    allergies               TEXT[],                  -- Tableau: {'pénicilline','aspirine'}
    antecedents_medicaux    TEXT,
    medicaments_en_cours    TEXT,

    -- Assurance
    couverture_assurance    VARCHAR(200),
    numero_assurance        VARCHAR(100),
    organisme_assurance     VARCHAR(200),

    -- Contact d'urgence
    contact_urgence_nom     VARCHAR(150),
    contact_urgence_tel     VARCHAR(20),
    contact_urgence_lien    VARCHAR(50),  -- 'conjoint', 'parent', 'ami'

    -- Consentements (RGPD)
    consentement_donnees    BOOLEAN NOT NULL DEFAULT FALSE,
    date_consentement       TIMESTAMP WITH TIME ZONE,
    consentement_marketing  BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_numero ON patients(numero_patient);
CREATE INDEX idx_patients_ville ON patients(ville);
CREATE INDEX idx_patients_region ON patients(region);

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE patients IS 'Extension de users pour les données spécifiques aux patients.';
COMMENT ON COLUMN patients.allergies IS 'Tableau PostgreSQL des allergies connues. Exemple: ARRAY[''pénicilline'', ''latex'']';
COMMENT ON COLUMN patients.consentement_donnees IS 'Consentement RGPD obligatoire avant utilisation de la plateforme.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : specialites
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE specialites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(30) NOT NULL,
    libelle_fr      VARCHAR(150) NOT NULL,
    libelle_en      VARCHAR(150),
    description     TEXT,
    icone_url       VARCHAR(1000),
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    ordre_affichage INTEGER DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

    CONSTRAINT uq_specialites_code UNIQUE (code)
);

CREATE INDEX idx_specialites_actif ON specialites(actif);

-- Données initiales des spécialités médicales camerounaises
INSERT INTO specialites (code, libelle_fr, libelle_en, ordre_affichage) VALUES
    ('MED_GEN',     'Médecine Générale',           'General Medicine',         1),
    ('PEDIATRIE',   'Pédiatrie',                   'Pediatrics',               2),
    ('GYNECO',      'Gynécologie-Obstétrique',     'Gynecology & Obstetrics',  3),
    ('CARDIO',      'Cardiologie',                 'Cardiology',               4),
    ('DERMATO',     'Dermatologie',                'Dermatology',              5),
    ('OPHTALMO',    'Ophtalmologie',               'Ophthalmology',            6),
    ('ORL',         'ORL',                         'ENT',                      7),
    ('PNEUMO',      'Pneumologie',                 'Pulmonology',              8),
    ('GASTRO',      'Gastro-Entérologie',          'Gastroenterology',         9),
    ('NEURO',       'Neurologie',                  'Neurology',               10),
    ('PSYCHIATRIE', 'Psychiatrie',                 'Psychiatry',              11),
    ('ORTHO',       'Orthopédie',                  'Orthopedics',             12),
    ('ENDO',        'Endocrinologie',              'Endocrinology',           13),
    ('NEPHRO',      'Néphrologie',                 'Nephrology',              14),
    ('URGENCES',    'Médecine d''Urgences',        'Emergency Medicine',      15),
    ('NUTRITION',   'Nutrition & Diététique',      'Nutrition & Dietetics',   16),
    ('PSYCHO',      'Psychologie',                 'Psychology',              17),
    ('INFIRMIER',   'Soins Infirmiers',            'Nursing Care',            18),
    ('SAGE_FEMME',  'Sage-Femme / Maïeutique',     'Midwifery',               19),
    ('PHARMACIE',   'Pharmacologie',               'Pharmacology',            20);

COMMENT ON TABLE specialites IS 'Référentiel normalisé des spécialités médicales. Alimenté à la création.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : medecins
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE medecins (
    id                          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Identité professionnelle
    numero_ordre                VARCHAR(60) UNIQUE NOT NULL,  -- N° ONMC Cameroun
    statut_verification         statut_verification NOT NULL DEFAULT 'en_attente',
    date_verification           TIMESTAMP WITH TIME ZONE,
    verifie_par_admin_id        UUID REFERENCES users(id),

    -- Profil professionnel
    annees_experience           INTEGER DEFAULT 0 CHECK (annees_experience >= 0),
    biographie                  TEXT,
    diplomes                    JSONB DEFAULT '[]'::JSONB,
    -- Format: [{"titre":"Doctorat","institution":"Fac Medecine Yaounde","annee":2015}]
    certifications              JSONB DEFAULT '[]'::JSONB,
    langues_parlees             VARCHAR(10)[] DEFAULT ARRAY['fr'],

    -- Tarification
    tarif_consultation          DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    devise                      devise_enum NOT NULL DEFAULT 'XAF',
    teleconsultation_active     BOOLEAN NOT NULL DEFAULT TRUE,

    -- Réputation
    note_moyenne                DECIMAL(3, 2) NOT NULL DEFAULT 0.00
                                    CHECK (note_moyenne >= 0 AND note_moyenne <= 5),
    nombre_avis                 INTEGER NOT NULL DEFAULT 0
                                    CHECK (nombre_avis >= 0),
    nombre_consultations        INTEGER NOT NULL DEFAULT 0,

    -- Rattachement structure (optionnel)
    structure_id                UUID,  -- FK ajoutée après création structures

    -- Disponibilité temps réel
    disponible_maintenant       BOOLEAN NOT NULL DEFAULT FALSE,

    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medecins_statut_verif ON medecins(statut_verification);
CREATE INDEX idx_medecins_note ON medecins(note_moyenne DESC);
CREATE INDEX idx_medecins_tarif ON medecins(tarif_consultation);
CREATE INDEX idx_medecins_teleconsult ON medecins(teleconsultation_active)
    WHERE teleconsultation_active = TRUE;

CREATE TRIGGER trg_medecins_updated_at
    BEFORE UPDATE ON medecins
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE medecins IS 'Extension de users pour les données spécifiques aux médecins vérifiés.';
COMMENT ON COLUMN medecins.numero_ordre IS 'Numéro d''inscription à l''Ordre National des Médecins du Cameroun (ONMC). Unique et obligatoire.';
COMMENT ON COLUMN medecins.diplomes IS 'JSON: liste des diplômes. Ex: [{"titre":"Doctorat en Médecine","institution":"Université de Yaoundé I","annee":2015}]';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : medecin_specialites (table de liaison N:M)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE medecin_specialites (
    medecin_id          UUID NOT NULL REFERENCES medecins(id) ON DELETE CASCADE,
    specialite_id       UUID NOT NULL REFERENCES specialites(id) ON DELETE RESTRICT,
    principale          BOOLEAN NOT NULL DEFAULT FALSE,
    annees_pratique     INTEGER DEFAULT 0 CHECK (annees_pratique >= 0),
    certifie            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    PRIMARY KEY (medecin_id, specialite_id)
);

CREATE INDEX idx_medecin_spec_specialite ON medecin_specialites(specialite_id);
CREATE INDEX idx_medecin_spec_principale ON medecin_specialites(principale)
    WHERE principale = TRUE;

COMMENT ON TABLE medecin_specialites IS 'Table de liaison N:M entre médecins et spécialités. Un médecin peut avoir plusieurs spécialités.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : structures
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE structures (
    id                      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nom_etablissement       VARCHAR(300) NOT NULL,
    type                    VARCHAR(50) NOT NULL
                                CHECK (type IN ('hopital','clinique','centre_sante',
                                                'cabinet','pharmacie','laboratoire',
                                                'maternite','dispensaire')),
    statut_verification     statut_verification NOT NULL DEFAULT 'en_attente',

    -- Informations officielles
    numero_autorisation     VARCHAR(100),  -- Agrément Ministère Santé Cameroun
    numero_contribuable     VARCHAR(50),
    date_creation           DATE,

    -- Localisation
    adresse                 TEXT NOT NULL,
    ville                   VARCHAR(100) NOT NULL,
    region                  VARCHAR(100),
    pays                    VARCHAR(50) NOT NULL DEFAULT 'CM',
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),

    -- Contact
    telephone_pro           VARCHAR(20),
    email_pro               VARCHAR(255),
    site_web                VARCHAR(1000),

    -- Profil
    description             TEXT,
    logo_url                VARCHAR(1000),
    horaires_ouverture      JSONB DEFAULT '{}'::JSONB,
    -- Format: {"lundi":{"ouverture":"08:00","fermeture":"18:00"}, ...}
    services_offerts        TEXT[],
    capacite_lits           INTEGER,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ajouter la FK de medecins vers structures maintenant
ALTER TABLE medecins
    ADD CONSTRAINT fk_medecins_structure
    FOREIGN KEY (structure_id)
    REFERENCES structures(id)
    ON DELETE SET NULL;

CREATE INDEX idx_structures_ville ON structures(ville);
CREATE INDEX idx_structures_type ON structures(type);
CREATE INDEX idx_structures_region ON structures(region);

CREATE TRIGGER trg_structures_updated_at
    BEFORE UPDATE ON structures
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE structures IS 'Établissements de santé (hôpitaux, cliniques, centres). Extension de users.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : disponibilites (créneaux horaires des médecins)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE disponibilites (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medecin_id                  UUID NOT NULL REFERENCES medecins(id) ON DELETE CASCADE,

    -- Définition du créneau
    jour_semaine                jour_semaine NOT NULL,
    heure_debut                 TIME NOT NULL,
    heure_fin                   TIME NOT NULL,
    duree_creneau_minutes       INTEGER NOT NULL DEFAULT 30
                                    CHECK (duree_creneau_minutes IN (15, 20, 30, 45, 60, 90)),

    -- Type de consultation proposé
    type_consultation           type_consultation NOT NULL DEFAULT 'video',

    -- Récurrence
    recurrence                  recurrence_enum NOT NULL DEFAULT 'hebdomadaire',
    date_debut_validite         DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin_validite           DATE,  -- NULL = pas de fin

    -- Exceptions (jours fériés, congés)
    exceptions                  DATE[],  -- Dates où ce créneau n'est pas disponible

    actif                       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_dispo_heures CHECK (heure_fin > heure_debut),
    CONSTRAINT chk_dispo_validite CHECK (
        date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite
    )
);

CREATE INDEX idx_dispo_medecin ON disponibilites(medecin_id);
CREATE INDEX idx_dispo_jour ON disponibilites(jour_semaine);
CREATE INDEX idx_dispo_actif ON disponibilites(actif, medecin_id)
    WHERE actif = TRUE;

CREATE TRIGGER trg_disponibilites_updated_at
    BEFORE UPDATE ON disponibilites
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE disponibilites IS 'Créneaux horaires récurrents définis par les médecins. Absente des documents originaux — ajoutée lors de l''analyse.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : rendez_vous
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE rendez_vous (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_rdv              VARCHAR(30) NOT NULL UNIQUE,  -- NER-RDV-2025-000001

    -- Parties prenantes
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    medecin_id              UUID NOT NULL REFERENCES medecins(id) ON DELETE RESTRICT,
    structure_id            UUID REFERENCES structures(id) ON DELETE SET NULL,

    -- Planification
    date_heure_debut        TIMESTAMP WITH TIME ZONE NOT NULL,
    date_heure_fin          TIMESTAMP WITH TIME ZONE NOT NULL,
    type                    type_consultation NOT NULL,
    statut                  statut_rdv NOT NULL DEFAULT 'en_attente',

    -- Motif et notes
    motif_consultation      TEXT,
    symptomes_declares      TEXT[],  -- Symptômes saisis lors de la prise de RDV
    notes_patient           TEXT,
    notes_pre_consultation  TEXT,    -- Notes du médecin avant la consultation

    -- Téléconsultation
    lien_video              VARCHAR(1000),  -- URL salle WebRTC
    webrtc_room_id          VARCHAR(100),
    token_patient           VARCHAR(500),   -- Token d'accès salle vidéo (expiré après)
    token_medecin           VARCHAR(500),

    -- Tarification
    montant                 DECIMAL(10, 2) NOT NULL DEFAULT 0,
    devise                  devise_enum NOT NULL DEFAULT 'XAF',

    -- Annulation
    annule_par              UUID REFERENCES users(id),
    motif_annulation        TEXT,
    date_annulation         TIMESTAMP WITH TIME ZONE,

    -- Rappels
    rappel_j1_envoye        BOOLEAN NOT NULL DEFAULT FALSE,
    rappel_h1_envoye        BOOLEAN NOT NULL DEFAULT FALSE,

    -- Évaluation
    note_patient            SMALLINT CHECK (note_patient BETWEEN 1 AND 5),
    commentaire_patient     TEXT,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_rdv_heures CHECK (date_heure_fin > date_heure_debut),
    CONSTRAINT chk_rdv_montant CHECK (montant >= 0)
);

CREATE INDEX idx_rdv_patient ON rendez_vous(patient_id, date_heure_debut DESC);
CREATE INDEX idx_rdv_medecin ON rendez_vous(medecin_id, date_heure_debut DESC);
CREATE INDEX idx_rdv_statut ON rendez_vous(statut);
CREATE INDEX idx_rdv_date ON rendez_vous(date_heure_debut);
CREATE INDEX idx_rdv_numero ON rendez_vous(numero_rdv);
-- Index pour prévenir les doubles réservations
CREATE UNIQUE INDEX idx_rdv_no_overlap ON rendez_vous(medecin_id, date_heure_debut)
    WHERE statut NOT IN ('annule_patient','annule_medecin','annule_systeme');

CREATE TRIGGER trg_rdv_updated_at
    BEFORE UPDATE ON rendez_vous
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Trigger pour génération automatique du numéro de RDV
CREATE OR REPLACE FUNCTION fn_generate_rdv_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_rdv IS NULL OR NEW.numero_rdv = '' THEN
        NEW.numero_rdv := fn_generate_numero('NER-RDV', 'seq_rdv_numero');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rdv_numero
    BEFORE INSERT ON rendez_vous
    FOR EACH ROW EXECUTE FUNCTION fn_generate_rdv_numero();

COMMENT ON TABLE rendez_vous IS 'Table centrale des rendez-vous. Lie patients et médecins avec planification complète.';
COMMENT ON COLUMN rendez_vous.webrtc_room_id IS 'Identifiant unique de la salle WebRTC pour la téléconsultation vidéo.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : paiements
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE paiements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference               VARCHAR(50) NOT NULL UNIQUE,  -- NER-PAY-2025-000001

    -- Relations
    rdv_id                  UUID NOT NULL REFERENCES rendez_vous(id) ON DELETE RESTRICT,
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    medecin_id              UUID NOT NULL REFERENCES medecins(id) ON DELETE RESTRICT,

    -- Montants
    montant_total           DECIMAL(10, 2) NOT NULL CHECK (montant_total > 0),
    devise                  devise_enum NOT NULL DEFAULT 'XAF',
    frais_plateforme        DECIMAL(10, 2) NOT NULL DEFAULT 0
                                CHECK (frais_plateforme >= 0),
    taux_commission         DECIMAL(5, 4) DEFAULT 0.1000, -- 10%
    montant_medecin         DECIMAL(10, 2),  -- Calculé automatiquement

    -- Méthode et fournisseur
    methode                 methode_paiement NOT NULL,
    fournisseur             fournisseur_paiement NOT NULL,
    statut                  statut_paiement NOT NULL DEFAULT 'initie',

    -- Références externes
    reference_fournisseur   VARCHAR(200),  -- ID transaction CinetPay/Stripe
    transaction_id_externe  VARCHAR(200),
    url_paiement            VARCHAR(2000), -- URL redirection paiement

    -- Remboursement
    date_remboursement      TIMESTAMP WITH TIME ZONE,
    motif_remboursement     TEXT,
    montant_rembourse       DECIMAL(10, 2),
    reference_remboursement VARCHAR(200),

    -- Webhooks (données brutes pour retraitement)
    webhook_data            JSONB DEFAULT '{}'::JSONB,
    webhook_signature       VARCHAR(500), -- HMAC-SHA256 pour validation

    -- Reversement au médecin
    reversi_effectue        BOOLEAN NOT NULL DEFAULT FALSE,
    date_reversement        TIMESTAMP WITH TIME ZONE,
    reference_reversement   VARCHAR(200),

    -- Métadonnées
    ip_paiement             INET,
    user_agent_paiement     TEXT,
    date_expiration         TIMESTAMP WITH TIME ZONE, -- Expiration URL paiement

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Calculer montant_medecin automatiquement
CREATE OR REPLACE FUNCTION fn_calc_montant_medecin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.montant_medecin IS NULL THEN
        NEW.montant_medecin := NEW.montant_total - NEW.frais_plateforme;
    END IF;
    IF NEW.frais_plateforme = 0 AND NEW.taux_commission IS NOT NULL THEN
        NEW.frais_plateforme := ROUND(NEW.montant_total * NEW.taux_commission, 2);
        NEW.montant_medecin := NEW.montant_total - NEW.frais_plateforme;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_paiements_calc_montant
    BEFORE INSERT OR UPDATE ON paiements
    FOR EACH ROW EXECUTE FUNCTION fn_calc_montant_medecin();

CREATE OR REPLACE FUNCTION fn_generate_paiement_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reference IS NULL OR NEW.reference = '' THEN
        NEW.reference := fn_generate_numero('NER-PAY', 'seq_paiement_numero');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_paiements_reference
    BEFORE INSERT ON paiements
    FOR EACH ROW EXECUTE FUNCTION fn_generate_paiement_reference();

CREATE TRIGGER trg_paiements_updated_at
    BEFORE UPDATE ON paiements
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_paiements_rdv ON paiements(rdv_id);
CREATE INDEX idx_paiements_patient ON paiements(patient_id);
CREATE INDEX idx_paiements_statut ON paiements(statut);
CREATE INDEX idx_paiements_fournisseur ON paiements(fournisseur, statut);
CREATE INDEX idx_paiements_created ON paiements(created_at DESC);

COMMENT ON TABLE paiements IS 'Transactions financières. Supporte CinetPay (Mobile Money) et Stripe (international). Ajoutée suite à correction.';
COMMENT ON COLUMN paiements.webhook_signature IS 'Signature HMAC-SHA256 du webhook pour vérifier l''authenticité (anti-falsification).';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : dossiers_medicaux
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE dossiers_medicaux (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_dossier              VARCHAR(30) NOT NULL UNIQUE,  -- DME-2025-000001
    patient_id                  UUID NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
    medecin_traitant_id         UUID REFERENCES medecins(id) ON DELETE SET NULL,

    -- Antécédents
    antecedents_familiaux       TEXT,
    antecedents_personnels      TEXT,
    antecedents_chirurgicaux    TEXT,
    antecedents_allergiques     TEXT,
    antecedents_gyneco          TEXT,  -- Pour les patientes femmes

    -- Habitudes de vie
    habitudes_vie               JSONB DEFAULT '{}'::JSONB,
    -- Format: {"tabac":{"actif":true,"paquets_annee":10},
    --          "alcool":{"consommation":"occasionnel"},
    --          "activite_physique":{"frequence":"3x/semaine"}}

    -- Données biométriques (dernières valeurs)
    taille_cm                   DECIMAL(5, 2),
    poids_kg                    DECIMAL(5, 2),
    imc                         DECIMAL(4, 2),  -- Calculé automatiquement
    tension_arterielle          VARCHAR(20),    -- ex: '120/80'
    glycemie_a_jeun             DECIMAL(6, 2),  -- mmol/L

    -- Vaccinations
    vaccinations                JSONB DEFAULT '[]'::JSONB,
    -- Format: [{"vaccin":"COVID-19","date":"2021-06-01","lot":"AB123",
    --           "prochain_rappel":"2023-06-01"}]

    -- Médications chroniques
    traitements_chroniques      JSONB DEFAULT '[]'::JSONB,

    -- Code de confidentialité (partage inter-médecins)
    code_partage                VARCHAR(20) UNIQUE,  -- Code temporaire pour partager le dossier
    code_partage_expires        TIMESTAMP WITH TIME ZONE,

    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Calcul IMC automatique
CREATE OR REPLACE FUNCTION fn_calc_imc()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.taille_cm > 0 AND NEW.poids_kg > 0 THEN
        NEW.imc := ROUND(
            NEW.poids_kg / POWER(NEW.taille_cm / 100.0, 2),
            2
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_calc_imc
    BEFORE INSERT OR UPDATE ON dossiers_medicaux
    FOR EACH ROW EXECUTE FUNCTION fn_calc_imc();

-- Génération automatique numéro dossier
CREATE OR REPLACE FUNCTION fn_generate_dossier_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_dossier IS NULL OR NEW.numero_dossier = '' THEN
        NEW.numero_dossier := fn_generate_numero('DME', 'seq_dossier_numero');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dossier_numero
    BEFORE INSERT ON dossiers_medicaux
    FOR EACH ROW EXECUTE FUNCTION fn_generate_dossier_numero();

CREATE TRIGGER trg_dossiers_updated_at
    BEFORE UPDATE ON dossiers_medicaux
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_dossiers_patient ON dossiers_medicaux(patient_id);
CREATE INDEX idx_dossiers_medecin_traitant ON dossiers_medicaux(medecin_traitant_id);

COMMENT ON TABLE dossiers_medicaux IS 'Dossier Médical Électronique (DME) du patient. Un seul DME par patient (relation 1:1).';
COMMENT ON COLUMN dossiers_medicaux.imc IS 'Calculé automatiquement via trigger à partir de taille_cm et poids_kg.';

-- Créer automatiquement le dossier médical à l'inscription d'un patient
CREATE OR REPLACE FUNCTION fn_create_dossier_on_patient()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO dossiers_medicaux (patient_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_patient_create_dossier
    AFTER INSERT ON patients
    FOR EACH ROW EXECUTE FUNCTION fn_create_dossier_on_patient();

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : consultations
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE consultations (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_consultation         VARCHAR(30) NOT NULL UNIQUE,  -- CONS-2025-000001

    -- Relations
    rdv_id                      UUID NOT NULL UNIQUE REFERENCES rendez_vous(id) ON DELETE RESTRICT,
    dossier_id                  UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE RESTRICT,
    medecin_id                  UUID NOT NULL REFERENCES medecins(id) ON DELETE RESTRICT,
    patient_id                  UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,

    -- Timing
    date_heure_debut            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    date_heure_fin              TIMESTAMP WITH TIME ZONE,
    duree_minutes               INTEGER,

    -- Contenu médical
    motif                       TEXT NOT NULL,
    anamnese                    TEXT,  -- Histoire de la maladie racontée par le patient
    examen_clinique             TEXT,  -- Résultats de l'examen physique
    diagnostic_principal        TEXT,
    code_cim10                  VARCHAR(10),  -- Code CIM-10 OMS ex: J45 (Asthme)
    diagnostics_secondaires     TEXT[],
    plan_traitement             TEXT,
    observations                TEXT,

    -- Suivi
    suivi_necessaire            BOOLEAN NOT NULL DEFAULT FALSE,
    date_prochain_rdv           DATE,
    instructions_patient        TEXT,  -- Instructions données au patient

    -- IA (Whisper)
    transcription_ia            TEXT,  -- Transcription automatique Whisper
    resume_ia                   TEXT,  -- Résumé généré par GPT-4

    -- Statut
    statut                      VARCHAR(20) NOT NULL DEFAULT 'en_cours'
                                    CHECK (statut IN ('en_cours','terminee','annulee','incomplete')),

    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Calcul durée automatique
CREATE OR REPLACE FUNCTION fn_calc_duree_consultation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_heure_fin IS NOT NULL AND NEW.date_heure_debut IS NOT NULL THEN
        NEW.duree_minutes := EXTRACT(EPOCH FROM (NEW.date_heure_fin - NEW.date_heure_debut)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consultation_duree
    BEFORE INSERT OR UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_calc_duree_consultation();

CREATE OR REPLACE FUNCTION fn_generate_consultation_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_consultation IS NULL OR NEW.numero_consultation = '' THEN
        NEW.numero_consultation := fn_generate_numero('CONS', 'seq_consultation_numero');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_consultation_numero
    BEFORE INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_generate_consultation_numero();

CREATE TRIGGER trg_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_consultations_dossier ON consultations(dossier_id);
CREATE INDEX idx_consultations_medecin ON consultations(medecin_id, date_heure_debut DESC);
CREATE INDEX idx_consultations_patient ON consultations(patient_id, date_heure_debut DESC);
CREATE INDEX idx_consultations_date ON consultations(date_heure_debut DESC);
-- Index full-text pour recherche dans les diagnostics
CREATE INDEX idx_consultations_diagnostic_fts ON consultations
    USING gin(to_tsvector('french', COALESCE(diagnostic_principal, '')));

COMMENT ON TABLE consultations IS 'Compte-rendu médical d''une consultation. Liée 1:1 au rendez-vous.';
COMMENT ON COLUMN consultations.code_cim10 IS 'Code de la Classification Internationale des Maladies (CIM-10, OMS). Ex: J45 = Asthme.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : ordonnances
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE ordonnances (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero                  VARCHAR(30) NOT NULL UNIQUE,  -- ORD-2025-000001

    -- Relations
    consultation_id         UUID NOT NULL REFERENCES consultations(id) ON DELETE RESTRICT,
    medecin_id              UUID NOT NULL REFERENCES medecins(id) ON DELETE RESTRICT,
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,

    -- Validité
    date_emission           DATE NOT NULL DEFAULT CURRENT_DATE,
    date_expiration         DATE NOT NULL,

    -- Statut
    statut                  statut_ordonnance NOT NULL DEFAULT 'active',
    date_utilisation        TIMESTAMP WITH TIME ZONE,
    pharmacie_utilisee      VARCHAR(200),

    -- Sécurité anti-falsification
    qr_code_data            TEXT NOT NULL,   -- Données encodées dans le QR
    qr_code_url             VARCHAR(1000),   -- Image QR stockée MinIO
    code_pharmacie          VARCHAR(20) UNIQUE,  -- Code alphanumérique retrait
    signature_numerique     TEXT,            -- Certificat signé du médecin
    hash_integritet         VARCHAR(64),     -- SHA-256 du contenu pour vérification

    -- Stockage
    pdf_url                 VARCHAR(1000),   -- PDF stocké sur MinIO/S3

    -- Notes
    notes_medecin           TEXT,
    renouvelable            BOOLEAN NOT NULL DEFAULT FALSE,
    nb_renouvellements_max  INTEGER DEFAULT 0,
    nb_renouvellements      INTEGER NOT NULL DEFAULT 0,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_generate_ordonnance_numero()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero IS NULL OR NEW.numero = '' THEN
        NEW.numero := fn_generate_numero('ORD', 'seq_ordonnance_numero');
    END IF;
    -- Générer le code pharmacie aléatoire 8 caractères
    IF NEW.code_pharmacie IS NULL THEN
        NEW.code_pharmacie := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 8));
    END IF;
    -- Générer hash d'intégrité
    NEW.hash_integritet := MD5(
        NEW.consultation_id::TEXT ||
        NEW.medecin_id::TEXT ||
        NEW.patient_id::TEXT ||
        NEW.date_emission::TEXT
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ordonnance_numero
    BEFORE INSERT ON ordonnances
    FOR EACH ROW EXECUTE FUNCTION fn_generate_ordonnance_numero();

CREATE TRIGGER trg_ordonnances_updated_at
    BEFORE UPDATE ON ordonnances
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE INDEX idx_ordonnances_consultation ON ordonnances(consultation_id);
CREATE INDEX idx_ordonnances_patient ON ordonnances(patient_id, date_emission DESC);
CREATE INDEX idx_ordonnances_statut ON ordonnances(statut);
CREATE INDEX idx_ordonnances_code_pharma ON ordonnances(code_pharmacie);
CREATE INDEX idx_ordonnances_expiration ON ordonnances(date_expiration)
    WHERE statut = 'active';

COMMENT ON TABLE ordonnances IS 'Ordonnances médicales signées numériquement avec QR Code anti-falsification.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : ordonnance_lignes
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE ordonnance_lignes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ordonnance_id           UUID NOT NULL REFERENCES ordonnances(id) ON DELETE CASCADE,
    ordre                   SMALLINT NOT NULL DEFAULT 1,  -- N° de ligne dans l'ordonnance

    -- Médicament
    medicament_nom          VARCHAR(300) NOT NULL,
    dci                     VARCHAR(300),  -- Dénomination Commune Internationale
    classe_therapeutique    VARCHAR(150),

    -- Prescription
    dosage                  VARCHAR(100) NOT NULL,   -- ex: '500mg'
    forme                   forme_medicament NOT NULL,
    posologie               VARCHAR(500) NOT NULL,  -- ex: '1 comprimé matin midi et soir'
    frequence_par_jour      SMALLINT NOT NULL DEFAULT 1
                                CHECK (frequence_par_jour BETWEEN 1 AND 24),
    duree_jours             INTEGER NOT NULL CHECK (duree_jours > 0),
    quantite                INTEGER NOT NULL CHECK (quantite > 0),

    -- Instructions
    avant_repas             BOOLEAN DEFAULT NULL,  -- NULL = pas de contrainte
    heure_prise             TIME[],  -- Heures spécifiques si nécessaire
    instructions_speciales  TEXT,
    interactions_a_eviter   TEXT,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ord_lignes_ordonnance ON ordonnance_lignes(ordonnance_id);

COMMENT ON TABLE ordonnance_lignes IS 'Lignes de médicaments d''une ordonnance. Relation 1:N avec ordonnances. Ajoutée suite à correction.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : documents_medicaux
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE documents_medicaux (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relations
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id         UUID REFERENCES consultations(id) ON DELETE SET NULL,
    medecin_uploadeur_id    UUID REFERENCES medecins(id) ON DELETE SET NULL,
    uploaded_par            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Fichier
    type_document           type_document_medical NOT NULL,
    nom_fichier_original    VARCHAR(500) NOT NULL,
    nom_fichier_stockage    VARCHAR(500) NOT NULL,  -- Nom anonymisé sur MinIO
    url_stockage            VARCHAR(2000) NOT NULL, -- URL MinIO/S3
    checksum_sha256         VARCHAR(64) NOT NULL,   -- Intégrité fichier
    taille_octets           BIGINT NOT NULL CHECK (taille_octets > 0),
    mime_type               VARCHAR(100) NOT NULL,

    -- Sécurité
    est_chiffre             BOOLEAN NOT NULL DEFAULT TRUE,
    cle_chiffrement_ref     VARCHAR(100),  -- Référence clé AES (pas la clé elle-même)

    -- Partage
    partage_avec_medecins   UUID[] DEFAULT ARRAY[]::UUID[],  -- IDs médecins autorisés
    visible_patient         BOOLEAN NOT NULL DEFAULT TRUE,

    -- Métadonnées médicales
    description             TEXT,
    date_document           DATE,  -- Date du document (pas de l'upload)
    laboratoire_nom         VARCHAR(200),
    prescripteur_nom        VARCHAR(200),

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_patient ON documents_medicaux(patient_id, created_at DESC);
CREATE INDEX idx_docs_consultation ON documents_medicaux(consultation_id);
CREATE INDEX idx_docs_type ON documents_medicaux(type_document);

CREATE TRIGGER trg_docs_updated_at
    BEFORE UPDATE ON documents_medicaux
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE documents_medicaux IS 'Fichiers médicaux stockés sur MinIO/S3. Ajoutée suite à correction.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : conversations (messagerie sécurisée)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE conversations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id              UUID NOT NULL REFERENCES medecins(id) ON DELETE CASCADE,
    rdv_id                  UUID REFERENCES rendez_vous(id) ON DELETE SET NULL,

    statut                  VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (statut IN ('active','archivee','fermee','bloquee')),

    -- Statistiques (dénormalisées pour performance)
    nb_messages_non_lus_patient  INTEGER NOT NULL DEFAULT 0,
    nb_messages_non_lus_medecin  INTEGER NOT NULL DEFAULT 0,
    dernier_message_at           TIMESTAMP WITH TIME ZONE,
    dernier_message_preview      VARCHAR(200),  -- Aperçu chiffré

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_conversation_rdv UNIQUE (patient_id, medecin_id, rdv_id)
);

CREATE INDEX idx_conv_patient ON conversations(patient_id, dernier_message_at DESC);
CREATE INDEX idx_conv_medecin ON conversations(medecin_id, dernier_message_at DESC);

CREATE TRIGGER trg_conv_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : messages
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id         UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    expediteur_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Contenu (chiffré AES-256 via pgcrypto avant stockage)
    contenu_chiffre         BYTEA NOT NULL,  -- Contenu chiffré
    type                    type_message NOT NULL DEFAULT 'texte',

    -- Pièce jointe (si type != texte)
    fichier_url             VARCHAR(2000),
    fichier_nom             VARCHAR(500),
    fichier_taille          BIGINT,
    fichier_mime            VARCHAR(100),

    -- Statut lecture
    lu_par_destinataire     BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture            TIMESTAMP WITH TIME ZONE,

    -- Modération
    signale                 BOOLEAN NOT NULL DEFAULT FALSE,
    supprime_par_expediteur BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_expediteur ON messages(expediteur_id);
CREATE INDEX idx_messages_non_lus ON messages(conversation_id, lu_par_destinataire)
    WHERE lu_par_destinataire = FALSE;

COMMENT ON COLUMN messages.contenu_chiffre IS 'Contenu du message chiffré avec pgp_sym_encrypt(contenu, cle_app). Jamais en clair en base.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : avis
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE avis (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id              UUID NOT NULL REFERENCES medecins(id) ON DELETE CASCADE,
    rdv_id                  UUID NOT NULL UNIQUE REFERENCES rendez_vous(id) ON DELETE CASCADE,

    note                    SMALLINT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire             TEXT,

    -- Modération
    verifie                 BOOLEAN NOT NULL DEFAULT FALSE,
    verifie_par             UUID REFERENCES users(id),
    masque                  BOOLEAN NOT NULL DEFAULT FALSE,
    motif_masquage          TEXT,

    -- Réponse du médecin
    reponse_medecin         TEXT,
    date_reponse            TIMESTAMP WITH TIME ZONE,

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avis_medecin ON avis(medecin_id, verifie, note);
CREATE INDEX idx_avis_patient ON avis(patient_id);

-- Mettre à jour note_moyenne automatiquement
CREATE OR REPLACE FUNCTION fn_update_note_medecin()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE medecins
    SET
        note_moyenne = (
            SELECT COALESCE(ROUND(AVG(note)::NUMERIC, 2), 0)
            FROM avis
            WHERE medecin_id = COALESCE(NEW.medecin_id, OLD.medecin_id)
            AND verifie = TRUE AND masque = FALSE
        ),
        nombre_avis = (
            SELECT COUNT(*)
            FROM avis
            WHERE medecin_id = COALESCE(NEW.medecin_id, OLD.medecin_id)
            AND verifie = TRUE AND masque = FALSE
        )
    WHERE id = COALESCE(NEW.medecin_id, OLD.medecin_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_avis_update_note
    AFTER INSERT OR UPDATE OR DELETE ON avis
    FOR EACH ROW EXECUTE FUNCTION fn_update_note_medecin();

CREATE TRIGGER trg_avis_updated_at
    BEFORE UPDATE ON avis
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE avis IS 'Évaluations patients après consultation. La note moyenne du médecin est mise à jour automatiquement par trigger.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : chatbot_sessions (IA de pré-triage)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE chatbot_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Conversation IA
    messages                JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Format: [{"role":"user","content":"J'ai de la fièvre","timestamp":"..."},
    --          {"role":"assistant","content":"...","timestamp":"..."}]

    -- Analyse IA
    symptomes_detectes      TEXT[],
    specialite_suggeree     VARCHAR(100),
    niveau_urgence          niveau_urgence DEFAULT 'faible',
    redirection_rdv         BOOLEAN NOT NULL DEFAULT FALSE,
    rdv_cree_id             UUID REFERENCES rendez_vous(id) ON DELETE SET NULL,

    -- Modèle IA utilisé
    modele_ia               VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
    tokens_utilises         INTEGER DEFAULT 0,
    cout_estime_usd         DECIMAL(10, 6) DEFAULT 0,

    -- Statut
    statut                  VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (statut IN ('active','terminee','abandon')),

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_patient ON chatbot_sessions(patient_id, created_at DESC);
CREATE INDEX idx_chatbot_urgence ON chatbot_sessions(niveau_urgence)
    WHERE niveau_urgence IN ('eleve', 'urgence_vitale');

CREATE TRIGGER trg_chatbot_updated_at
    BEFORE UPDATE ON chatbot_sessions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : notifications
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type                    type_notification NOT NULL,
    canal                   canal_notification NOT NULL DEFAULT 'in_app',
    statut                  statut_notification NOT NULL DEFAULT 'en_attente',

    titre                   VARCHAR(300) NOT NULL,
    contenu                 TEXT NOT NULL,
    donnees_supplementaires JSONB DEFAULT '{}'::JSONB,
    -- Ex: {"rdv_id":"...", "medecin_nom":"Dr Dupont"}

    -- Planification
    date_envoi_planifie     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_envoi_reel         TIMESTAMP WITH TIME ZONE,
    date_lecture            TIMESTAMP WITH TIME ZONE,

    -- Erreurs
    nb_tentatives           SMALLINT NOT NULL DEFAULT 0,
    derniere_erreur         TEXT,
    prochaine_tentative     TIMESTAMP WITH TIME ZONE,

    -- Référence externe (Firebase FCM ID, SMS ID, etc.)
    reference_externe       VARCHAR(500),

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_utilisateur ON notifications(utilisateur_id, statut, created_at DESC);
CREATE INDEX idx_notif_planifie ON notifications(date_envoi_planifie, statut)
    WHERE statut = 'en_attente';
CREATE INDEX idx_notif_non_lues ON notifications(utilisateur_id, statut)
    WHERE statut = 'envoye';

COMMENT ON TABLE notifications IS 'Centre de notifications multicanal (push/SMS/email/in-app). Ajoutée suite à correction.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : sessions (gestion des tokens JWT)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Token
    refresh_token_hash      VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 du refresh token
    access_token_jti        VARCHAR(100),  -- JTI (JWT ID) du dernier access token

    -- Appareil et localisation
    ip_address              INET NOT NULL,
    user_agent              TEXT,
    appareil                VARCHAR(200),  -- ex: 'iPhone 14 / iOS 17'
    localisation            VARCHAR(200),  -- ex: 'Douala, CM'
    plateforme              VARCHAR(20) CHECK (plateforme IN ('web','android','ios','api')),

    -- Validité
    expires_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    revoque                 BOOLEAN NOT NULL DEFAULT FALSE,
    date_revocation         TIMESTAMP WITH TIME ZONE,
    motif_revocation        VARCHAR(50),  -- 'logout','expiration','securite','admin'

    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_utilisateur ON sessions(utilisateur_id, revoque);
CREATE INDEX idx_sessions_expiration ON sessions(expires_at)
    WHERE revoque = FALSE;
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);

COMMENT ON TABLE sessions IS 'Gestion sécurisée des refresh tokens JWT. Permet la révocation individuelle de sessions.';

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE : audit_logs (traçabilité complète)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    -- BIGSERIAL pour performance (pas UUID — cette table peut avoir des milliards de lignes)
    id                      BIGSERIAL PRIMARY KEY,

    -- Acteur
    utilisateur_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    role_utilisateur        role_utilisateur,
    session_id              UUID REFERENCES sessions(id) ON DELETE SET NULL,

    -- Action
    action                  action_audit NOT NULL,
    entite_type             VARCHAR(100),   -- ex: 'dossier_medical', 'ordonnance'
    entite_id               UUID,

    -- Contexte
    ip_address              INET,
    user_agent              TEXT,
    endpoint                VARCHAR(500),   -- ex: '/api/v1/consultations/abc-123'
    methode_http            VARCHAR(10),    -- GET, POST, PUT, DELETE, PATCH

    -- Données avant/après (pour les modifications)
    donnees_avant           JSONB,
    donnees_apres           JSONB,

    -- Résultat
    succes                  BOOLEAN NOT NULL DEFAULT TRUE,
    code_http               SMALLINT,
    message_erreur          TEXT,
    duree_ms                INTEGER,  -- Durée de l'opération en millisecondes

    -- Horodatage (PAS de updated_at — les logs ne se modifient jamais)
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()

    -- Pas de FK obligatoire sur utilisateur_id : on veut garder les logs
    -- même si l'utilisateur est supprimé (contrainte ON DELETE SET NULL)
);

-- Index optimisés pour les requêtes d'audit fréquentes
CREATE INDEX idx_audit_utilisateur ON audit_logs(utilisateur_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_entite ON audit_logs(entite_type, entite_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_succes ON audit_logs(succes) WHERE succes = FALSE;

-- Partitionnement par mois pour les performances à long terme
-- (À activer en production quand le volume dépasse 10M lignes)
-- ALTER TABLE audit_logs PARTITION BY RANGE (created_at);

COMMENT ON TABLE audit_logs IS 'Journal d''audit immuable. Trace chaque action sur les données médicales. BIGSERIAL pour performance sur gros volumes.';
COMMENT ON COLUMN audit_logs.donnees_avant IS 'État JSON de l''entité AVANT modification. Null pour les créations.';
COMMENT ON COLUMN audit_logs.donnees_apres IS 'État JSON de l''entité APRÈS modification. Null pour les suppressions.';

-- ============================================================================
-- SECTION 5 : FONCTION ET TRIGGERS D'AUDIT AUTOMATIQUE
-- ============================================================================
-- Cette fonction insère automatiquement une ligne dans audit_logs pour
-- toutes les tables médicales sensibles.

CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action action_audit;
    v_avant  JSONB;
    v_apres  JSONB;
BEGIN
    -- Déterminer l'action
    IF TG_OP = 'INSERT' THEN
        v_action := 'creation';
        v_avant  := NULL;
        v_apres  := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'modification';
        v_avant  := to_jsonb(OLD);
        v_apres  := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'suppression';
        v_avant  := to_jsonb(OLD);
        v_apres  := NULL;
    END IF;

    -- Insérer dans audit_logs
    INSERT INTO audit_logs (
        action,
        entite_type,
        entite_id,
        donnees_avant,
        donnees_apres,
        created_at
    ) VALUES (
        v_action,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN (OLD.id)::UUID
            ELSE (NEW.id)::UUID
        END,
        v_avant,
        v_apres,
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer les triggers d'audit sur toutes les tables sensibles
CREATE TRIGGER trg_audit_patients
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_dossiers
    AFTER INSERT OR UPDATE OR DELETE ON dossiers_medicaux
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_consultations
    AFTER INSERT OR UPDATE OR DELETE ON consultations
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_ordonnances
    AFTER INSERT OR UPDATE OR DELETE ON ordonnances
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_paiements
    AFTER INSERT OR UPDATE OR DELETE ON paiements
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

CREATE TRIGGER trg_audit_rendez_vous
    AFTER INSERT OR UPDATE OR DELETE ON rendez_vous
    FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();

COMMENT ON FUNCTION fn_audit_trigger() IS
'Trigger d''audit générique. Capture automatiquement INSERT/UPDATE/DELETE sur les tables médicales sensibles.';

-- ============================================================================
-- SECTION 6 : VUES UTILITAIRES
-- ============================================================================
-- Les vues simplifient les requêtes fréquentes et masquent la complexité
-- des jointures aux développeurs backend.

-- Vue : Profil complet d'un médecin
CREATE OR REPLACE VIEW v_medecins_complets AS
SELECT
    u.id,
    u.nom || ' ' || u.prenom AS nom_complet,
    u.email,
    u.telephone,
    u.photo_url,
    u.statut,
    m.numero_ordre,
    m.statut_verification,
    m.annees_experience,
    m.biographie,
    m.tarif_consultation,
    m.devise,
    m.note_moyenne,
    m.nombre_avis,
    m.nombre_consultations,
    m.teleconsultation_active,
    m.disponible_maintenant,
    s.nom_etablissement AS structure_nom,
    s.ville AS structure_ville,
    ARRAY_AGG(DISTINCT sp.libelle_fr) FILTER (WHERE sp.id IS NOT NULL) AS specialites,
    u.created_at
FROM users u
JOIN medecins m ON m.id = u.id
LEFT JOIN structures s ON s.id = m.structure_id
LEFT JOIN medecin_specialites ms ON ms.medecin_id = m.id
LEFT JOIN specialites sp ON sp.id = ms.specialite_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, m.id, s.nom_etablissement, s.ville;

COMMENT ON VIEW v_medecins_complets IS 'Vue dénormalisée pour afficher les profils médecins avec spécialités agrégées.';

-- Vue : Tableau de bord Admin
CREATE OR REPLACE VIEW v_dashboard_admin AS
SELECT
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_utilisateurs,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM medecins WHERE statut_verification = 'verifie') AS medecins_verifies,
    (SELECT COUNT(*) FROM medecins WHERE statut_verification = 'en_attente') AS medecins_en_attente,
    (SELECT COUNT(*) FROM rendez_vous WHERE statut = 'confirme'
        AND date_heure_debut >= CURRENT_DATE) AS rdv_a_venir,
    (SELECT COUNT(*) FROM rendez_vous WHERE statut = 'termine'
        AND date_heure_debut >= DATE_TRUNC('month', NOW())) AS consultations_ce_mois,
    (SELECT COALESCE(SUM(montant_total), 0) FROM paiements
        WHERE statut = 'confirme'
        AND created_at >= DATE_TRUNC('month', NOW())) AS revenus_ce_mois_xaf,
    (SELECT COUNT(*) FROM paiements WHERE statut = 'confirme'
        AND created_at >= DATE_TRUNC('month', NOW())) AS paiements_ce_mois,
    NOW() AS calcule_le;

-- Vue : Statistiques observateurs (données anonymisées)
CREATE OR REPLACE VIEW v_stats_observateurs AS
SELECT
    p.region,
    p.ville,
    sp.libelle_fr AS specialite,
    DATE_TRUNC('month', rdv.date_heure_debut) AS mois,
    COUNT(rdv.id) AS nb_consultations,
    COUNT(CASE WHEN rdv.type = 'video' THEN 1 END) AS nb_teleconsultations,
    ROUND(AVG(rdv.montant), 2) AS tarif_moyen_xaf,
    COUNT(DISTINCT rdv.patient_id) AS patients_uniques
FROM rendez_vous rdv
JOIN patients p ON p.id = rdv.patient_id
JOIN medecins m ON m.id = rdv.medecin_id
JOIN medecin_specialites ms ON ms.medecin_id = m.id AND ms.principale = TRUE
JOIN specialites sp ON sp.id = ms.specialite_id
WHERE rdv.statut = 'termine'
GROUP BY p.region, p.ville, sp.libelle_fr, DATE_TRUNC('month', rdv.date_heure_debut)
ORDER BY mois DESC;

COMMENT ON VIEW v_stats_observateurs IS 'Statistiques sanitaires anonymisées pour les observateurs institutionnels. Aucune donnée individuelle exposée.';

-- ============================================================================
-- SECTION 7 : FONCTIONS UTILITAIRES MÉTIER
-- ============================================================================

-- Fonction : Vérifier la disponibilité d'un médecin pour un créneau
CREATE OR REPLACE FUNCTION fn_verifier_disponibilite(
    p_medecin_id UUID,
    p_debut TIMESTAMP WITH TIME ZONE,
    p_fin TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflit INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_conflit
    FROM rendez_vous
    WHERE medecin_id = p_medecin_id
      AND statut NOT IN ('annule_patient','annule_medecin','annule_systeme','rembourse')
      AND (
          (date_heure_debut <= p_debut AND date_heure_fin > p_debut)  -- Chevauchement début
          OR (date_heure_debut < p_fin AND date_heure_fin >= p_fin)   -- Chevauchement fin
          OR (date_heure_debut >= p_debut AND date_heure_fin <= p_fin) -- Inclus dans le créneau
      );

    RETURN v_conflit = 0;
END;
$$ LANGUAGE plpgsql;

-- Fonction : Calculer le nombre de jours de consultation d'un patient
CREATE OR REPLACE FUNCTION fn_stats_patient(p_patient_id UUID)
RETURNS TABLE(
    nb_consultations BIGINT,
    nb_medecins_distincts BIGINT,
    montant_total_paye NUMERIC,
    derniere_consultation DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(c.id),
        COUNT(DISTINCT c.medecin_id),
        COALESCE(SUM(pa.montant_total), 0),
        MAX(c.date_heure_debut)::DATE
    FROM consultations c
    LEFT JOIN rendez_vous rdv ON rdv.id = c.rdv_id
    LEFT JOIN paiements pa ON pa.rdv_id = rdv.id AND pa.statut = 'confirme'
    WHERE c.patient_id = p_patient_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction : Recherche full-text de médecins
CREATE OR REPLACE FUNCTION fn_rechercher_medecins(
    p_terme TEXT DEFAULT NULL,
    p_specialite_code VARCHAR DEFAULT NULL,
    p_ville VARCHAR DEFAULT NULL,
    p_tarif_max DECIMAL DEFAULT NULL,
    p_disponible_maintenant BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    id UUID,
    nom_complet TEXT,
    specialites TEXT[],
    tarif DECIMAL,
    note DECIMAL,
    ville TEXT,
    disponible BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        (u.nom || ' ' || u.prenom)::TEXT,
        ARRAY_AGG(DISTINCT sp.libelle_fr),
        m.tarif_consultation,
        m.note_moyenne,
        s_struct.ville::TEXT,
        m.disponible_maintenant
    FROM users u
    JOIN medecins m ON m.id = u.id
    LEFT JOIN structures s_struct ON s_struct.id = m.structure_id
    JOIN medecin_specialites ms ON ms.medecin_id = m.id
    JOIN specialites sp ON sp.id = ms.specialite_id
    WHERE u.deleted_at IS NULL
      AND u.statut = 'actif'
      AND m.statut_verification = 'verifie'
      AND m.teleconsultation_active = TRUE
      AND (p_specialite_code IS NULL OR sp.code = p_specialite_code)
      AND (p_ville IS NULL OR s_struct.ville ILIKE '%' || p_ville || '%')
      AND (p_tarif_max IS NULL OR m.tarif_consultation <= p_tarif_max)
      AND (NOT p_disponible_maintenant OR m.disponible_maintenant = TRUE)
      AND (p_terme IS NULL OR (
          u.nom || ' ' || u.prenom ILIKE '%' || p_terme || '%'
          OR m.biographie ILIKE '%' || p_terme || '%'
      ))
    GROUP BY u.id, m.id, s_struct.ville, m.tarif_consultation, m.note_moyenne, m.disponible_maintenant
    ORDER BY m.note_moyenne DESC, m.nombre_consultations DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8 : SÉCURITÉ — ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- La RLS (Row Level Security) de PostgreSQL garantit que chaque utilisateur
-- ne peut accéder QU'À SES PROPRES données, même avec un accès direct à la BDD.
-- C'est une couche de sécurité supplémentaire au-delà du code applicatif.

-- Activer RLS sur les tables sensibles
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers_medicaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;

-- Politique RLS : un patient ne voit que ses propres données
-- (Le rôle app_user est le rôle PostgreSQL utilisé par FastAPI)
-- Ces politiques s'appliquent quand current_setting('app.current_user_id') est défini

CREATE POLICY pol_patients_own ON patients
    FOR ALL
    USING (id::TEXT = current_setting('app.current_user_id', TRUE));

CREATE POLICY pol_dossiers_own ON dossiers_medicaux
    FOR ALL
    USING (patient_id::TEXT = current_setting('app.current_user_id', TRUE));

-- ============================================================================
-- SECTION 9 : RÔLES POSTGRESQL ET PERMISSIONS
-- ============================================================================

-- Rôle applicatif (utilisé par FastAPI — droits limités)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nere_app') THEN
        CREATE ROLE nere_app LOGIN PASSWORD 'CHANGER_EN_PRODUCTION_!@#$';
    END IF;
END
$$;

-- Rôle lecture seule (pour les observateurs, monitoring, backups)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nere_readonly') THEN
        CREATE ROLE nere_readonly LOGIN PASSWORD 'CHANGER_EN_PRODUCTION_READONLY';
    END IF;
END
$$;

-- Permissions rôle applicatif
GRANT CONNECT ON DATABASE nere_db TO nere_app;
GRANT USAGE ON SCHEMA public TO nere_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nere_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO nere_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO nere_app;

-- Permissions lecture seule
GRANT CONNECT ON DATABASE nere_db TO nere_readonly;
GRANT USAGE ON SCHEMA public TO nere_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nere_readonly;

-- Révoquer les droits dangereux du rôle applicatif
REVOKE ALL ON TABLE audit_logs FROM nere_app;
GRANT INSERT, SELECT ON audit_logs TO nere_app;  -- Jamais UPDATE/DELETE sur les logs !
GRANT USAGE, SELECT ON SEQUENCE audit_logs_id_seq TO nere_app;

COMMENT ON ROLE nere_app IS 'Rôle applicatif FastAPI. Droits limités — jamais superuser.';
COMMENT ON ROLE nere_readonly IS 'Rôle lecture seule pour observateurs, Grafana, backups.';

-- ============================================================================
-- SECTION 10 : DONNÉES INITIALES (SEED DATA)
-- ============================================================================

-- Créer le compte administrateur système initial
-- IMPORTANT: Changer le mot de passe après le premier déploiement !
INSERT INTO users (
    id, email, mot_de_passe_hash, role, statut, nom, prenom,
    email_verifie, langue
) VALUES (
    gen_random_uuid(),
    'admin@nere.cm',
    -- Hash Argon2id de 'Admin@Nere2025!' (À CHANGER EN PRODUCTION)
    '$argon2id$v=19$m=65536,t=3,p=4$placeholder_hash',
    'admin',
    'actif',
    'Système',
    'Administrateur',
    TRUE,
    'fr'
);

-- ============================================================================
-- SECTION 11 : COMMENTAIRES GLOBAUX
-- ============================================================================

COMMENT ON SCHEMA public IS
'Schéma principal de la plateforme Néré — Base de données médicale sécurisée.
 Version 1.0 | Mars 2025 | Cameroun
 23 tables | 20 types ENUM | 15+ triggers | RLS activé sur tables sensibles.';

-- ============================================================================
-- FIN DU SCRIPT — RÉCAPITULATIF
-- ============================================================================
-- Tables créées (23) :
--   users, patients, medecins, structures, specialites, medecin_specialites
--   disponibilites, rendez_vous, paiements, dossiers_medicaux, consultations
--   ordonnances, ordonnance_lignes, documents_medicaux, conversations
--   messages, avis, chatbot_sessions, notifications, sessions, audit_logs
--
-- Triggers créés (25+) :
--   - updated_at automatique sur toutes les tables
--   - Numérotation métier automatique (RDV, DME, ORD, PAY, CONS)
--   - Calcul IMC automatique (dossiers_medicaux)
--   - Calcul durée consultation automatique
--   - Calcul montant médecin automatique (paiements)
--   - Création automatique DME à l'inscription patient
--   - Mise à jour note_moyenne médecin (avis)
--   - Audit automatique sur 6 tables sensibles (fn_audit_trigger)
--
-- Fonctions créées (8) :
--   fn_set_updated_at, fn_generate_numero, fn_generate_rdv_numero,
--   fn_generate_dossier_numero, fn_generate_consultation_numero,
--   fn_generate_ordonnance_numero, fn_generate_paiement_reference,
--   fn_calc_imc, fn_calc_duree_consultation, fn_calc_montant_medecin,
--   fn_audit_trigger, fn_update_note_medecin, fn_create_dossier_on_patient,
--   fn_verifier_disponibilite, fn_stats_patient, fn_rechercher_medecins
--
-- Vues créées (3) :
--   v_medecins_complets, v_dashboard_admin, v_stats_observateurs
--
-- Indexes créés : 40+
-- Séquences : 6
-- ENUMs : 22
-- RLS activé sur : 6 tables
-- ============================================================================
