--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'SchÃ©ma principal de la plateforme NÃ©rÃ© â€” Base de donnÃ©es mÃ©dicale sÃ©curisÃ©e.
 Version 1.0 | Mars 2025 | Cameroun
 23 tables | 20 types ENUM | 15+ triggers | RLS activÃ© sur tables sensibles.';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


--
-- Name: action_audit; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.action_audit AS ENUM (
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


ALTER TYPE public.action_audit OWNER TO postgres;

--
-- Name: canal_notification; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.canal_notification AS ENUM (
    'push',
    'sms',
    'email',
    'in_app',
    'whatsapp'
);


ALTER TYPE public.canal_notification OWNER TO postgres;

--
-- Name: devise_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.devise_enum AS ENUM (
    'XAF',
    'EUR',
    'USD',
    'GBP',
    'XOF'
);


ALTER TYPE public.devise_enum OWNER TO postgres;

--
-- Name: forme_medicament; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.forme_medicament AS ENUM (
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


ALTER TYPE public.forme_medicament OWNER TO postgres;

--
-- Name: fournisseur_paiement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.fournisseur_paiement AS ENUM (
    'cinetpay',
    'stripe',
    'notchpay',
    'interne'
);


ALTER TYPE public.fournisseur_paiement OWNER TO postgres;

--
-- Name: groupe_sanguin_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.groupe_sanguin_enum AS ENUM (
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
    'Inconnu'
);


ALTER TYPE public.groupe_sanguin_enum OWNER TO postgres;

--
-- Name: jour_semaine; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jour_semaine AS ENUM (
    'lundi',
    'mardi',
    'mercredi',
    'jeudi',
    'vendredi',
    'samedi',
    'dimanche'
);


ALTER TYPE public.jour_semaine OWNER TO postgres;

--
-- Name: methode_paiement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.methode_paiement AS ENUM (
    'mtn_momo',
    'orange_money',
    'carte_visa',
    'carte_mastercard',
    'virement_bancaire',
    'notchpay',
    'stripe',
    'portefeuille_nere'
);


ALTER TYPE public.methode_paiement OWNER TO postgres;

--
-- Name: niveau_urgence; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.niveau_urgence AS ENUM (
    'faible',
    'modere',
    'eleve',
    'urgence_vitale'
);


ALTER TYPE public.niveau_urgence OWNER TO postgres;

--
-- Name: recurrence_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recurrence_enum AS ENUM (
    'unique',
    'quotidien',
    'hebdomadaire',
    'bi_mensuel',
    'mensuel'
);


ALTER TYPE public.recurrence_enum OWNER TO postgres;

--
-- Name: role_utilisateur; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_utilisateur AS ENUM (
    'patient',
    'medecin',
    'structure',
    'admin',
    'observateur'
);


ALTER TYPE public.role_utilisateur OWNER TO postgres;

--
-- Name: TYPE role_utilisateur; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.role_utilisateur IS 'RÃ´les distincts des utilisateurs de la plateforme NÃ©rÃ©';


--
-- Name: sexe_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sexe_enum AS ENUM (
    'M',
    'F',
    'Autre',
    'Non_precise'
);


ALTER TYPE public.sexe_enum OWNER TO postgres;

--
-- Name: statut_compte; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_compte AS ENUM (
    'actif',
    'inactif',
    'suspendu',
    'en_attente',
    'supprime'
);


ALTER TYPE public.statut_compte OWNER TO postgres;

--
-- Name: statut_notification; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_notification AS ENUM (
    'en_attente',
    'envoye',
    'lu',
    'echoue',
    'expire'
);


ALTER TYPE public.statut_notification OWNER TO postgres;

--
-- Name: statut_ordonnance; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_ordonnance AS ENUM (
    'active',
    'utilisee',
    'partiellement_utilisee',
    'expiree',
    'annulee'
);


ALTER TYPE public.statut_ordonnance OWNER TO postgres;

--
-- Name: statut_paiement; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_paiement AS ENUM (
    'initie',
    'en_attente_confirmation',
    'confirme',
    'echoue',
    'rembourse',
    'rembourse_partiel',
    'annule',
    'expire'
);


ALTER TYPE public.statut_paiement OWNER TO postgres;

--
-- Name: TYPE statut_paiement; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.statut_paiement IS 'Ã‰tats possibles d''une transaction financiÃ¨re';


--
-- Name: statut_rdv; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_rdv AS ENUM (
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


ALTER TYPE public.statut_rdv OWNER TO postgres;

--
-- Name: TYPE statut_rdv; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TYPE public.statut_rdv IS 'Cycle de vie complet d''un rendez-vous mÃ©dical';


--
-- Name: statut_verification; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.statut_verification AS ENUM (
    'en_attente',
    'en_cours_verification',
    'verifie',
    'rejete',
    'suspendu'
);


ALTER TYPE public.statut_verification OWNER TO postgres;

--
-- Name: theme_interface; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.theme_interface AS ENUM (
    'clair',
    'sombre',
    'auto'
);


ALTER TYPE public.theme_interface OWNER TO postgres;

--
-- Name: type_consultation; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_consultation AS ENUM (
    'presentiel',
    'video',
    'audio',
    'chat'
);


ALTER TYPE public.type_consultation OWNER TO postgres;

--
-- Name: type_document_medical; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_document_medical AS ENUM (
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


ALTER TYPE public.type_document_medical OWNER TO postgres;

--
-- Name: type_message; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_message AS ENUM (
    'texte',
    'image',
    'document',
    'audio',
    'video',
    'systeme'
);


ALTER TYPE public.type_message OWNER TO postgres;

--
-- Name: type_notification; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.type_notification AS ENUM (
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


ALTER TYPE public.type_notification OWNER TO postgres;

--
-- Name: fn_audit_trigger(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE v_action action_audit;
v_avant JSONB;
v_apres JSONB;
BEGIN -- DÃ©terminer l'action
IF TG_OP = 'INSERT' THEN v_action := 'creation';
v_avant := NULL;
v_apres := to_jsonb(NEW);
ELSIF TG_OP = 'UPDATE' THEN v_action := 'modification';
v_avant := to_jsonb(OLD);
v_apres := to_jsonb(NEW);
ELSIF TG_OP = 'DELETE' THEN v_action := 'suppression';
v_avant := to_jsonb(OLD);
v_apres := NULL;
END IF;
-- InsÃ©rer dans audit_logs
INSERT INTO audit_logs (
        action,
        entite_type,
        entite_id,
        donnees_avant,
        donnees_apres,
        created_at
    )
VALUES (
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
$$;


ALTER FUNCTION public.fn_audit_trigger() OWNER TO postgres;

--
-- Name: FUNCTION fn_audit_trigger(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_audit_trigger() IS 'Trigger d''audit gÃ©nÃ©rique. Capture automatiquement INSERT/UPDATE/DELETE sur les tables mÃ©dicales sensibles.';


--
-- Name: fn_calc_duree_consultation(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calc_duree_consultation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.date_heure_fin IS NOT NULL
    AND NEW.date_heure_debut IS NOT NULL THEN NEW.duree_minutes := EXTRACT(
        EPOCH
        FROM (NEW.date_heure_fin - NEW.date_heure_debut)
    ) / 60;
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_calc_duree_consultation() OWNER TO postgres;

--
-- Name: fn_calc_imc(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calc_imc() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.taille_cm > 0
    AND NEW.poids_kg > 0 THEN NEW.imc := ROUND(
        NEW.poids_kg / POWER(NEW.taille_cm / 100.0, 2),
        2
    );
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_calc_imc() OWNER TO postgres;

--
-- Name: fn_calc_montant_medecin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_calc_montant_medecin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.montant_medecin IS NULL THEN NEW.montant_medecin := NEW.montant_total - NEW.frais_plateforme;
END IF;
IF NEW.frais_plateforme = 0
AND NEW.taux_commission IS NOT NULL THEN NEW.frais_plateforme := ROUND(NEW.montant_total * NEW.taux_commission, 2);
NEW.montant_medecin := NEW.montant_total - NEW.frais_plateforme;
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_calc_montant_medecin() OWNER TO postgres;

--
-- Name: fn_create_dossier_on_patient(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_create_dossier_on_patient() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN
INSERT INTO dossiers_medicaux (patient_id)
VALUES (NEW.id);
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_create_dossier_on_patient() OWNER TO postgres;

--
-- Name: fn_generate_consultation_numero(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_consultation_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.numero_consultation IS NULL
    OR NEW.numero_consultation = '' THEN NEW.numero_consultation := fn_generate_numero('CONS', 'seq_consultation_numero');
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_consultation_numero() OWNER TO postgres;

--
-- Name: fn_generate_dossier_numero(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_dossier_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.numero_dossier IS NULL
    OR NEW.numero_dossier = '' THEN NEW.numero_dossier := fn_generate_numero('DME', 'seq_dossier_numero');
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_dossier_numero() OWNER TO postgres;

--
-- Name: fn_generate_numero(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_numero(prefix text, seq_name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE next_val BIGINT;
annee TEXT;
BEGIN annee := TO_CHAR(NOW(), 'YYYY');
EXECUTE 'SELECT nextval(''' || seq_name || ''')' INTO next_val;
RETURN prefix || '-' || annee || '-' || LPAD(next_val::TEXT, 6, '0');
END;
$$;


ALTER FUNCTION public.fn_generate_numero(prefix text, seq_name text) OWNER TO postgres;

--
-- Name: fn_generate_ordonnance_numero(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_ordonnance_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.numero IS NULL
    OR NEW.numero = '' THEN NEW.numero := fn_generate_numero('ORD', 'seq_ordonnance_numero');
END IF;
-- GÃ©nÃ©rer le code pharmacie alÃ©atoire 8 caractÃ¨res
IF NEW.code_pharmacie IS NULL THEN NEW.code_pharmacie := UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 8));
END IF;
-- GÃ©nÃ©rer hash d'intÃ©gritÃ©
NEW.hash_integritet := MD5(
    NEW.consultation_id::TEXT || NEW.medecin_id::TEXT || NEW.patient_id::TEXT || NEW.date_emission::TEXT
);
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_ordonnance_numero() OWNER TO postgres;

--
-- Name: fn_generate_paiement_reference(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_paiement_reference() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.reference IS NULL
    OR NEW.reference = '' THEN NEW.reference := fn_generate_numero('NER-PAY', 'seq_paiement_numero');
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_paiement_reference() OWNER TO postgres;

--
-- Name: fn_generate_rdv_numero(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_generate_rdv_numero() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN IF NEW.numero_rdv IS NULL
    OR NEW.numero_rdv = '' THEN NEW.numero_rdv := fn_generate_numero('NER-RDV', 'seq_rdv_numero');
END IF;
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_generate_rdv_numero() OWNER TO postgres;

--
-- Name: fn_rechercher_medecins(text, character varying, character varying, numeric, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_rechercher_medecins(p_terme text DEFAULT NULL::text, p_specialite_code character varying DEFAULT NULL::character varying, p_ville character varying DEFAULT NULL::character varying, p_tarif_max numeric DEFAULT NULL::numeric, p_disponible_maintenant boolean DEFAULT false) RETURNS TABLE(id uuid, nom_complet text, specialites text[], tarif numeric, note numeric, ville text, disponible boolean)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY
SELECT u.id,
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
    AND (
        p_specialite_code IS NULL
        OR sp.code = p_specialite_code
    )
    AND (
        p_ville IS NULL
        OR s_struct.ville ILIKE '%' || p_ville || '%'
    )
    AND (
        p_tarif_max IS NULL
        OR m.tarif_consultation <= p_tarif_max
    )
    AND (
        NOT p_disponible_maintenant
        OR m.disponible_maintenant = TRUE
    )
    AND (
        p_terme IS NULL
        OR (
            u.nom || ' ' || u.prenom ILIKE '%' || p_terme || '%'
            OR m.biographie ILIKE '%' || p_terme || '%'
        )
    )
GROUP BY u.id,
    m.id,
    s_struct.ville,
    m.tarif_consultation,
    m.note_moyenne,
    m.disponible_maintenant
ORDER BY m.note_moyenne DESC,
    m.nombre_consultations DESC;
END;
$$;


ALTER FUNCTION public.fn_rechercher_medecins(p_terme text, p_specialite_code character varying, p_ville character varying, p_tarif_max numeric, p_disponible_maintenant boolean) OWNER TO postgres;

--
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_set_updated_at() OWNER TO postgres;

--
-- Name: FUNCTION fn_set_updated_at(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.fn_set_updated_at() IS 'Trigger function: met Ã  jour automatiquement le champ updated_at Ã  chaque modification';


--
-- Name: fn_stats_patient(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_stats_patient(p_patient_id uuid) RETURNS TABLE(nb_consultations bigint, nb_medecins_distincts bigint, montant_total_paye numeric, derniere_consultation date)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY
SELECT COUNT(c.id),
    COUNT(DISTINCT c.medecin_id),
    COALESCE(SUM(pa.montant_total), 0),
    MAX(c.date_heure_debut)::DATE
FROM consultations c
    LEFT JOIN rendez_vous rdv ON rdv.id = c.rdv_id
    LEFT JOIN paiements pa ON pa.rdv_id = rdv.id
    AND pa.statut = 'confirme'
WHERE c.patient_id = p_patient_id;
END;
$$;


ALTER FUNCTION public.fn_stats_patient(p_patient_id uuid) OWNER TO postgres;

--
-- Name: fn_update_note_medecin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_update_note_medecin() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ BEGIN
UPDATE medecins
SET note_moyenne = (
        SELECT COALESCE(ROUND(AVG(note)::NUMERIC, 2), 0)
        FROM avis
        WHERE medecin_id = COALESCE(NEW.medecin_id, OLD.medecin_id)
            AND verifie = TRUE
            AND masque = FALSE
    ),
    nombre_avis = (
        SELECT COUNT(*)
        FROM avis
        WHERE medecin_id = COALESCE(NEW.medecin_id, OLD.medecin_id)
            AND verifie = TRUE
            AND masque = FALSE
    )
WHERE id = COALESCE(NEW.medecin_id, OLD.medecin_id);
RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.fn_update_note_medecin() OWNER TO postgres;

--
-- Name: fn_verifier_disponibilite(uuid, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_verifier_disponibilite(p_medecin_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE v_conflit INTEGER;
BEGIN
SELECT COUNT(*) INTO v_conflit
FROM rendez_vous
WHERE medecin_id = p_medecin_id
    AND statut NOT IN (
        'annule_patient',
        'annule_medecin',
        'annule_systeme',
        'rembourse'
    )
    AND (
        (
            date_heure_debut <= p_debut
            AND date_heure_fin > p_debut
        ) -- Chevauchement dÃ©but
        OR (
            date_heure_debut < p_fin
            AND date_heure_fin >= p_fin
        ) -- Chevauchement fin
        OR (
            date_heure_debut >= p_debut
            AND date_heure_fin <= p_fin
        ) -- Inclus dans le crÃ©neau
    );
RETURN v_conflit = 0;
END;
$$;


ALTER FUNCTION public.fn_verifier_disponibilite(p_medecin_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    utilisateur_id uuid,
    role_utilisateur public.role_utilisateur,
    session_id uuid,
    action public.action_audit NOT NULL,
    entite_type character varying(100),
    entite_id uuid,
    ip_address inet,
    user_agent text,
    endpoint character varying(500),
    methode_http character varying(10),
    donnees_avant jsonb,
    donnees_apres jsonb,
    succes boolean DEFAULT true NOT NULL,
    code_http smallint,
    message_erreur text,
    duree_ms integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_logs IS 'Journal d''audit immuable. Trace chaque action sur les donnÃ©es mÃ©dicales. BIGSERIAL pour performance sur gros volumes.';


--
-- Name: COLUMN audit_logs.donnees_avant; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.donnees_avant IS 'Ã‰tat JSON de l''entitÃ© AVANT modification. Null pour les crÃ©ations.';


--
-- Name: COLUMN audit_logs.donnees_apres; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.audit_logs.donnees_apres IS 'Ã‰tat JSON de l''entitÃ© APRÃˆS modification. Null pour les suppressions.';


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: avis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    rdv_id uuid NOT NULL,
    note smallint NOT NULL,
    commentaire text,
    verifie boolean DEFAULT false NOT NULL,
    verifie_par uuid,
    masque boolean DEFAULT false NOT NULL,
    motif_masquage text,
    reponse_medecin text,
    date_reponse timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT avis_note_check CHECK (((note >= 1) AND (note <= 5)))
);


ALTER TABLE public.avis OWNER TO postgres;

--
-- Name: TABLE avis; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.avis IS 'Ã‰valuations patients aprÃ¨s consultation. La note moyenne du mÃ©decin est mise Ã  jour automatiquement par trigger.';


--
-- Name: chatbot_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatbot_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    messages jsonb DEFAULT '[]'::jsonb NOT NULL,
    symptomes_detectes text[],
    specialite_suggeree character varying(100),
    niveau_urgence public.niveau_urgence DEFAULT 'faible'::public.niveau_urgence,
    redirection_rdv boolean DEFAULT false NOT NULL,
    rdv_cree_id uuid,
    modele_ia character varying(50) DEFAULT 'gpt-4o-mini'::character varying NOT NULL,
    tokens_utilises integer DEFAULT 0,
    cout_estime_usd numeric(10,6) DEFAULT 0,
    statut character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chatbot_sessions_statut_check CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'terminee'::character varying, 'abandon'::character varying])::text[])))
);


ALTER TABLE public.chatbot_sessions OWNER TO postgres;

--
-- Name: consultations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consultations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_consultation character varying(30) NOT NULL,
    rdv_id uuid NOT NULL,
    dossier_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    date_heure_debut timestamp with time zone DEFAULT now() NOT NULL,
    date_heure_fin timestamp with time zone,
    duree_minutes integer,
    motif text NOT NULL,
    anamnese text,
    examen_clinique text,
    diagnostic_principal text,
    code_cim10 character varying(10),
    diagnostics_secondaires text[],
    plan_traitement text,
    observations text,
    suivi_necessaire boolean DEFAULT false NOT NULL,
    date_prochain_rdv date,
    instructions_patient text,
    transcription_ia text,
    resume_ia text,
    statut character varying(20) DEFAULT 'en_cours'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT consultations_statut_check CHECK (((statut)::text = ANY ((ARRAY['en_cours'::character varying, 'terminee'::character varying, 'annulee'::character varying, 'incomplete'::character varying])::text[])))
);


ALTER TABLE public.consultations OWNER TO postgres;

--
-- Name: TABLE consultations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.consultations IS 'Compte-rendu mÃ©dical d''une consultation. LiÃ©e 1:1 au rendez-vous.';


--
-- Name: COLUMN consultations.code_cim10; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.consultations.code_cim10 IS 'Code de la Classification Internationale des Maladies (CIM-10, OMS). Ex: J45 = Asthme.';


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    rdv_id uuid,
    statut character varying(20) DEFAULT 'active'::character varying NOT NULL,
    nb_messages_non_lus_patient integer DEFAULT 0 NOT NULL,
    nb_messages_non_lus_medecin integer DEFAULT 0 NOT NULL,
    dernier_message_at timestamp with time zone,
    dernier_message_preview character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT conversations_statut_check CHECK (((statut)::text = ANY ((ARRAY['active'::character varying, 'archivee'::character varying, 'fermee'::character varying, 'bloquee'::character varying])::text[])))
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: disponibilites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disponibilites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    medecin_id uuid NOT NULL,
    jour_semaine public.jour_semaine NOT NULL,
    heure_debut time without time zone NOT NULL,
    heure_fin time without time zone NOT NULL,
    duree_creneau_minutes integer DEFAULT 30 NOT NULL,
    type_consultation public.type_consultation DEFAULT 'video'::public.type_consultation NOT NULL,
    recurrence public.recurrence_enum DEFAULT 'hebdomadaire'::public.recurrence_enum NOT NULL,
    date_debut_validite date DEFAULT CURRENT_DATE NOT NULL,
    date_fin_validite date,
    exceptions date[],
    actif boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_dispo_heures CHECK ((heure_fin > heure_debut)),
    CONSTRAINT chk_dispo_validite CHECK (((date_fin_validite IS NULL) OR (date_fin_validite >= date_debut_validite))),
    CONSTRAINT disponibilites_duree_creneau_minutes_check CHECK ((duree_creneau_minutes = ANY (ARRAY[15, 20, 30, 45, 60, 90])))
);


ALTER TABLE public.disponibilites OWNER TO postgres;

--
-- Name: TABLE disponibilites; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.disponibilites IS 'CrÃ©neaux horaires rÃ©currents dÃ©finis par les mÃ©decins. Absente des documents originaux â€” ajoutÃ©e lors de l''analyse.';


--
-- Name: documents_medicaux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents_medicaux (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    consultation_id uuid,
    medecin_uploadeur_id uuid,
    uploaded_par uuid NOT NULL,
    type_document public.type_document_medical NOT NULL,
    nom_fichier_original character varying(500) NOT NULL,
    nom_fichier_stockage character varying(500) NOT NULL,
    url_stockage character varying(2000) NOT NULL,
    checksum_sha256 character varying(64) NOT NULL,
    taille_octets bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    est_chiffre boolean DEFAULT true NOT NULL,
    cle_chiffrement_ref character varying(100),
    partage_avec_medecins uuid[] DEFAULT ARRAY[]::uuid[],
    visible_patient boolean DEFAULT true NOT NULL,
    description text,
    date_document date,
    laboratoire_nom character varying(200),
    prescripteur_nom character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT documents_medicaux_taille_octets_check CHECK ((taille_octets > 0))
);


ALTER TABLE public.documents_medicaux OWNER TO postgres;

--
-- Name: TABLE documents_medicaux; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.documents_medicaux IS 'Fichiers mÃ©dicaux stockÃ©s sur MinIO/S3. AjoutÃ©e suite Ã  correction.';


--
-- Name: dossiers_medicaux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dossiers_medicaux (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_dossier character varying(30) NOT NULL,
    patient_id uuid NOT NULL,
    medecin_traitant_id uuid,
    antecedents_familiaux text,
    antecedents_personnels text,
    antecedents_chirurgicaux text,
    antecedents_allergiques text,
    antecedents_gyneco text,
    habitudes_vie jsonb DEFAULT '{}'::jsonb,
    taille_cm numeric(5,2),
    poids_kg numeric(5,2),
    imc numeric(4,2),
    tension_arterielle character varying(20),
    glycemie_a_jeun numeric(6,2),
    vaccinations jsonb DEFAULT '[]'::jsonb,
    traitements_chroniques jsonb DEFAULT '[]'::jsonb,
    code_partage character varying(20),
    code_partage_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.dossiers_medicaux OWNER TO postgres;

--
-- Name: TABLE dossiers_medicaux; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.dossiers_medicaux IS 'Dossier MÃ©dical Ã‰lectronique (DME) du patient. Un seul DME par patient (relation 1:1).';


--
-- Name: COLUMN dossiers_medicaux.imc; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.dossiers_medicaux.imc IS 'CalculÃ© automatiquement via trigger Ã  partir de taille_cm et poids_kg.';


--
-- Name: medecin_specialites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medecin_specialites (
    medecin_id uuid NOT NULL,
    specialite_id uuid NOT NULL,
    principale boolean DEFAULT false NOT NULL,
    annees_pratique integer DEFAULT 0,
    certifie boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT medecin_specialites_annees_pratique_check CHECK ((annees_pratique >= 0))
);


ALTER TABLE public.medecin_specialites OWNER TO postgres;

--
-- Name: TABLE medecin_specialites; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.medecin_specialites IS 'Table de liaison N:M entre mÃ©decins et spÃ©cialitÃ©s. Un mÃ©decin peut avoir plusieurs spÃ©cialitÃ©s.';


--
-- Name: medecins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medecins (
    id uuid NOT NULL,
    numero_ordre character varying(60) NOT NULL,
    statut_verification public.statut_verification DEFAULT 'en_attente'::public.statut_verification NOT NULL,
    date_verification timestamp with time zone,
    verifie_par_admin_id uuid,
    annees_experience integer DEFAULT 0,
    biographie text,
    diplomes jsonb DEFAULT '[]'::jsonb,
    certifications jsonb DEFAULT '[]'::jsonb,
    langues_parlees character varying(10)[] DEFAULT ARRAY['fr'::text],
    tarif_consultation numeric(10,2) DEFAULT 5000.00 NOT NULL,
    devise public.devise_enum DEFAULT 'XAF'::public.devise_enum NOT NULL,
    teleconsultation_active boolean DEFAULT true NOT NULL,
    note_moyenne numeric(3,2) DEFAULT 0.00 NOT NULL,
    nombre_avis integer DEFAULT 0 NOT NULL,
    nombre_consultations integer DEFAULT 0 NOT NULL,
    structure_id uuid,
    disponible_maintenant boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT medecins_annees_experience_check CHECK ((annees_experience >= 0)),
    CONSTRAINT medecins_nombre_avis_check CHECK ((nombre_avis >= 0)),
    CONSTRAINT medecins_note_moyenne_check CHECK (((note_moyenne >= (0)::numeric) AND (note_moyenne <= (5)::numeric)))
);


ALTER TABLE public.medecins OWNER TO postgres;

--
-- Name: TABLE medecins; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.medecins IS 'Extension de users pour les donnÃ©es spÃ©cifiques aux mÃ©decins vÃ©rifiÃ©s.';


--
-- Name: COLUMN medecins.numero_ordre; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.medecins.numero_ordre IS 'NumÃ©ro d''inscription Ã  l''Ordre National des MÃ©decins du Cameroun (ONMC). Unique et obligatoire.';


--
-- Name: COLUMN medecins.diplomes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.medecins.diplomes IS 'JSON: liste des diplÃ´mes. Ex: [{"titre":"Doctorat en MÃ©decine","institution":"UniversitÃ© de YaoundÃ© I","annee":2015}]';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    expediteur_id uuid NOT NULL,
    contenu_chiffre bytea NOT NULL,
    type public.type_message DEFAULT 'texte'::public.type_message NOT NULL,
    fichier_url character varying(2000),
    fichier_nom character varying(500),
    fichier_taille bigint,
    fichier_mime character varying(100),
    lu_par_destinataire boolean DEFAULT false NOT NULL,
    date_lecture timestamp with time zone,
    signale boolean DEFAULT false NOT NULL,
    supprime_par_expediteur boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: COLUMN messages.contenu_chiffre; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.messages.contenu_chiffre IS 'Contenu du message chiffrÃ© avec pgp_sym_encrypt(contenu, cle_app). Jamais en clair en base.';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    type public.type_notification NOT NULL,
    canal public.canal_notification DEFAULT 'in_app'::public.canal_notification NOT NULL,
    statut public.statut_notification DEFAULT 'en_attente'::public.statut_notification NOT NULL,
    titre character varying(300) NOT NULL,
    contenu text NOT NULL,
    donnees_supplementaires jsonb DEFAULT '{}'::jsonb,
    date_envoi_planifie timestamp with time zone DEFAULT now(),
    date_envoi_reel timestamp with time zone,
    date_lecture timestamp with time zone,
    nb_tentatives smallint DEFAULT 0 NOT NULL,
    derniere_erreur text,
    prochaine_tentative timestamp with time zone,
    reference_externe character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.notifications IS 'Centre de notifications multicanal (push/SMS/email/in-app). AjoutÃ©e suite Ã  correction.';


--
-- Name: ordonnance_lignes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordonnance_lignes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ordonnance_id uuid NOT NULL,
    ordre smallint DEFAULT 1 NOT NULL,
    medicament_nom character varying(300) NOT NULL,
    dci character varying(300),
    classe_therapeutique character varying(150),
    dosage character varying(100) NOT NULL,
    forme public.forme_medicament NOT NULL,
    posologie character varying(500) NOT NULL,
    frequence_par_jour smallint DEFAULT 1 NOT NULL,
    duree_jours integer NOT NULL,
    quantite integer NOT NULL,
    avant_repas boolean,
    heure_prise time without time zone[],
    instructions_speciales text,
    interactions_a_eviter text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ordonnance_lignes_duree_jours_check CHECK ((duree_jours > 0)),
    CONSTRAINT ordonnance_lignes_frequence_par_jour_check CHECK (((frequence_par_jour >= 1) AND (frequence_par_jour <= 24))),
    CONSTRAINT ordonnance_lignes_quantite_check CHECK ((quantite > 0))
);


ALTER TABLE public.ordonnance_lignes OWNER TO postgres;

--
-- Name: TABLE ordonnance_lignes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ordonnance_lignes IS 'Lignes de mÃ©dicaments d''une ordonnance. Relation 1:N avec ordonnances. AjoutÃ©e suite Ã  correction.';


--
-- Name: ordonnances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordonnances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero character varying(30) NOT NULL,
    consultation_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    date_emission date DEFAULT CURRENT_DATE NOT NULL,
    date_expiration date NOT NULL,
    statut public.statut_ordonnance DEFAULT 'active'::public.statut_ordonnance NOT NULL,
    date_utilisation timestamp with time zone,
    pharmacie_utilisee character varying(200),
    qr_code_data text NOT NULL,
    qr_code_url character varying(1000),
    code_pharmacie character varying(20),
    signature_numerique text,
    hash_integritet character varying(64),
    pdf_url character varying(1000),
    notes_medecin text,
    renouvelable boolean DEFAULT false NOT NULL,
    nb_renouvellements_max integer DEFAULT 0,
    nb_renouvellements integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ordonnances OWNER TO postgres;

--
-- Name: TABLE ordonnances; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ordonnances IS 'Ordonnances mÃ©dicales signÃ©es numÃ©riquement avec QR Code anti-falsification.';


--
-- Name: paiements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paiements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference character varying(50) NOT NULL,
    rdv_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    montant_total numeric(10,2) NOT NULL,
    devise public.devise_enum DEFAULT 'XAF'::public.devise_enum NOT NULL,
    frais_plateforme numeric(10,2) DEFAULT 0 NOT NULL,
    taux_commission numeric(5,4) DEFAULT 0.1000,
    montant_medecin numeric(10,2),
    methode public.methode_paiement NOT NULL,
    fournisseur public.fournisseur_paiement NOT NULL,
    statut public.statut_paiement DEFAULT 'initie'::public.statut_paiement NOT NULL,
    reference_fournisseur character varying(200),
    transaction_id_externe character varying(200),
    url_paiement character varying(2000),
    date_remboursement timestamp with time zone,
    motif_remboursement text,
    montant_rembourse numeric(10,2),
    reference_remboursement character varying(200),
    webhook_data jsonb DEFAULT '{}'::jsonb,
    webhook_signature character varying(500),
    reversi_effectue boolean DEFAULT false NOT NULL,
    date_reversement timestamp with time zone,
    reference_reversement character varying(200),
    ip_paiement inet,
    user_agent_paiement text,
    date_expiration timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT paiements_frais_plateforme_check CHECK ((frais_plateforme >= (0)::numeric)),
    CONSTRAINT paiements_montant_total_check CHECK ((montant_total > (0)::numeric))
);


ALTER TABLE public.paiements OWNER TO postgres;

--
-- Name: TABLE paiements; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.paiements IS 'Transactions financiÃ¨res. Supporte CinetPay (Mobile Money) et Stripe (international). AjoutÃ©e suite Ã  correction.';


--
-- Name: COLUMN paiements.webhook_signature; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.paiements.webhook_signature IS 'Signature HMAC-SHA256 du webhook pour vÃ©rifier l''authenticitÃ© (anti-falsification).';


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    id uuid NOT NULL,
    numero_patient character varying(25) NOT NULL,
    date_naissance date,
    sexe public.sexe_enum DEFAULT 'Non_precise'::public.sexe_enum,
    groupe_sanguin public.groupe_sanguin_enum DEFAULT 'Inconnu'::public.groupe_sanguin_enum,
    adresse text,
    ville character varying(100),
    region character varying(100),
    pays character varying(50) DEFAULT 'CM'::character varying NOT NULL,
    code_postal character varying(10),
    latitude numeric(10,8),
    longitude numeric(11,8),
    taille_cm numeric(5,2),
    poids_kg numeric(5,2),
    allergies text[],
    antecedents_medicaux text,
    medicaments_en_cours text,
    couverture_assurance character varying(200),
    numero_assurance character varying(100),
    organisme_assurance character varying(200),
    contact_urgence_nom character varying(150),
    contact_urgence_tel character varying(20),
    contact_urgence_lien character varying(50),
    consentement_donnees boolean DEFAULT false NOT NULL,
    date_consentement timestamp with time zone,
    consentement_marketing boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT patients_poids_kg_check CHECK (((poids_kg > (0)::numeric) AND (poids_kg < (700)::numeric))),
    CONSTRAINT patients_taille_cm_check CHECK (((taille_cm > (0)::numeric) AND (taille_cm < (300)::numeric)))
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: TABLE patients; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.patients IS 'Extension de users pour les donnÃ©es spÃ©cifiques aux patients.';


--
-- Name: COLUMN patients.allergies; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.allergies IS 'Tableau PostgreSQL des allergies connues. Exemple: ARRAY[''pÃ©nicilline'', ''latex'']';


--
-- Name: COLUMN patients.consentement_donnees; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.patients.consentement_donnees IS 'Consentement RGPD obligatoire avant utilisation de la plateforme.';


--
-- Name: rendez_vous; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rendez_vous (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero_rdv character varying(30) NOT NULL,
    patient_id uuid NOT NULL,
    medecin_id uuid NOT NULL,
    structure_id uuid,
    date_heure_debut timestamp with time zone NOT NULL,
    date_heure_fin timestamp with time zone NOT NULL,
    type public.type_consultation NOT NULL,
    statut public.statut_rdv DEFAULT 'en_attente'::public.statut_rdv NOT NULL,
    motif_consultation text,
    symptomes_declares text[],
    notes_patient text,
    notes_pre_consultation text,
    lien_video character varying(1000),
    webrtc_room_id character varying(100),
    token_patient character varying(500),
    token_medecin character varying(500),
    montant numeric(10,2) DEFAULT 0 NOT NULL,
    devise public.devise_enum DEFAULT 'XAF'::public.devise_enum NOT NULL,
    annule_par uuid,
    motif_annulation text,
    date_annulation timestamp with time zone,
    rappel_j1_envoye boolean DEFAULT false NOT NULL,
    rappel_h1_envoye boolean DEFAULT false NOT NULL,
    note_patient smallint,
    commentaire_patient text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_rdv_heures CHECK ((date_heure_fin > date_heure_debut)),
    CONSTRAINT chk_rdv_montant CHECK ((montant >= (0)::numeric)),
    CONSTRAINT rendez_vous_note_patient_check CHECK (((note_patient >= 1) AND (note_patient <= 5)))
);


ALTER TABLE public.rendez_vous OWNER TO postgres;

--
-- Name: TABLE rendez_vous; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.rendez_vous IS 'Table centrale des rendez-vous. Lie patients et mÃ©decins avec planification complÃ¨te.';


--
-- Name: COLUMN rendez_vous.webrtc_room_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.rendez_vous.webrtc_room_id IS 'Identifiant unique de la salle WebRTC pour la tÃ©lÃ©consultation vidÃ©o.';


--
-- Name: seq_consultation_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_consultation_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_consultation_numero OWNER TO postgres;

--
-- Name: seq_dossier_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_dossier_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_dossier_numero OWNER TO postgres;

--
-- Name: seq_ordonnance_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_ordonnance_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_ordonnance_numero OWNER TO postgres;

--
-- Name: seq_paiement_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_paiement_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_paiement_numero OWNER TO postgres;

--
-- Name: seq_patient_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_patient_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_patient_numero OWNER TO postgres;

--
-- Name: seq_rdv_numero; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_rdv_numero
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_rdv_numero OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    utilisateur_id uuid NOT NULL,
    refresh_token_hash character varying(255) NOT NULL,
    access_token_jti character varying(100),
    ip_address inet NOT NULL,
    user_agent text,
    appareil character varying(200),
    localisation character varying(200),
    plateforme character varying(20),
    expires_at timestamp with time zone NOT NULL,
    revoque boolean DEFAULT false NOT NULL,
    date_revocation timestamp with time zone,
    motif_revocation character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sessions_plateforme_check CHECK (((plateforme)::text = ANY ((ARRAY['web'::character varying, 'android'::character varying, 'ios'::character varying, 'api'::character varying])::text[])))
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sessions IS 'Gestion sÃ©curisÃ©e des refresh tokens JWT. Permet la rÃ©vocation individuelle de sessions.';


--
-- Name: specialites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(30) NOT NULL,
    libelle_fr character varying(150) NOT NULL,
    libelle_en character varying(150),
    description text,
    icone_url character varying(1000),
    actif boolean DEFAULT true NOT NULL,
    ordre_affichage integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.specialites OWNER TO postgres;

--
-- Name: TABLE specialites; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.specialites IS 'RÃ©fÃ©rentiel normalisÃ© des spÃ©cialitÃ©s mÃ©dicales. AlimentÃ© Ã  la crÃ©ation.';


--
-- Name: structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.structures (
    id uuid NOT NULL,
    nom_etablissement character varying(300) NOT NULL,
    type character varying(50) NOT NULL,
    statut_verification public.statut_verification DEFAULT 'en_attente'::public.statut_verification NOT NULL,
    numero_autorisation character varying(100),
    numero_contribuable character varying(50),
    date_creation date,
    adresse text NOT NULL,
    ville character varying(100) NOT NULL,
    region character varying(100),
    pays character varying(50) DEFAULT 'CM'::character varying NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    telephone_pro character varying(20),
    email_pro character varying(255),
    site_web character varying(1000),
    description text,
    logo_url character varying(1000),
    horaires_ouverture jsonb DEFAULT '{}'::jsonb,
    services_offerts text[],
    capacite_lits integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT structures_type_check CHECK (((type)::text = ANY ((ARRAY['hopital'::character varying, 'clinique'::character varying, 'centre_sante'::character varying, 'cabinet'::character varying, 'pharmacie'::character varying, 'laboratoire'::character varying, 'maternite'::character varying, 'dispensaire'::character varying])::text[])))
);


ALTER TABLE public.structures OWNER TO postgres;

--
-- Name: TABLE structures; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.structures IS 'Ã‰tablissements de santÃ© (hÃ´pitaux, cliniques, centres). Extension de users.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    telephone character varying(20),
    mot_de_passe_hash character varying(255) NOT NULL,
    role public.role_utilisateur NOT NULL,
    statut public.statut_compte DEFAULT 'en_attente'::public.statut_compte NOT NULL,
    nom character varying(100),
    prenom character varying(100),
    photo_url character varying(1000),
    langue character varying(5) DEFAULT 'fr'::character varying NOT NULL,
    theme public.theme_interface DEFAULT 'clair'::public.theme_interface NOT NULL,
    totp_secret character varying(100),
    totp_actif boolean DEFAULT false NOT NULL,
    email_verifie boolean DEFAULT false NOT NULL,
    email_otp character varying(6),
    email_otp_expires timestamp with time zone,
    telephone_verifie boolean DEFAULT false NOT NULL,
    reset_password_token character varying(255),
    reset_password_token_expires timestamp with time zone,
    last_login timestamp with time zone,
    nb_tentatives_connexion integer DEFAULT 0 NOT NULL,
    bloque_jusqu_a timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT chk_users_email_format CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT chk_users_nb_tentatives CHECK ((nb_tentatives_connexion >= 0)),
    CONSTRAINT users_langue_check CHECK (((langue)::text = ANY ((ARRAY['fr'::character varying, 'en'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Table centrale de tous les utilisateurs NÃ©rÃ©. HÃ©ritÃ©e par patients, medecins, structures.';


--
-- Name: COLUMN users.mot_de_passe_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.mot_de_passe_hash IS 'Hash Argon2id du mot de passe. Jamais le mot de passe en clair.';


--
-- Name: COLUMN users.totp_secret; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.totp_secret IS 'ClÃ© secrÃ¨te TOTP chiffrÃ©e avec AES-256 avant stockage en base.';


--
-- Name: COLUMN users.deleted_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.deleted_at IS 'Soft delete : l''enregistrement n''est pas supprimÃ© physiquement.';


--
-- Name: v_dashboard_admin; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dashboard_admin AS
 SELECT ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.deleted_at IS NULL)) AS total_utilisateurs,
    ( SELECT count(*) AS count
           FROM public.patients) AS total_patients,
    ( SELECT count(*) AS count
           FROM public.medecins
          WHERE (medecins.statut_verification = 'verifie'::public.statut_verification)) AS medecins_verifies,
    ( SELECT count(*) AS count
           FROM public.medecins
          WHERE (medecins.statut_verification = 'en_attente'::public.statut_verification)) AS medecins_en_attente,
    ( SELECT count(*) AS count
           FROM public.rendez_vous
          WHERE ((rendez_vous.statut = 'confirme'::public.statut_rdv) AND (rendez_vous.date_heure_debut >= CURRENT_DATE))) AS rdv_a_venir,
    ( SELECT count(*) AS count
           FROM public.rendez_vous
          WHERE ((rendez_vous.statut = 'termine'::public.statut_rdv) AND (rendez_vous.date_heure_debut >= date_trunc('month'::text, now())))) AS consultations_ce_mois,
    ( SELECT COALESCE(sum(paiements.montant_total), (0)::numeric) AS "coalesce"
           FROM public.paiements
          WHERE ((paiements.statut = 'confirme'::public.statut_paiement) AND (paiements.created_at >= date_trunc('month'::text, now())))) AS revenus_ce_mois_xaf,
    ( SELECT count(*) AS count
           FROM public.paiements
          WHERE ((paiements.statut = 'confirme'::public.statut_paiement) AND (paiements.created_at >= date_trunc('month'::text, now())))) AS paiements_ce_mois,
    now() AS calcule_le;


ALTER VIEW public.v_dashboard_admin OWNER TO postgres;

--
-- Name: v_medecins_complets; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_medecins_complets AS
SELECT
    NULL::uuid AS id,
    NULL::text AS nom_complet,
    NULL::character varying(255) AS email,
    NULL::character varying(20) AS telephone,
    NULL::character varying(1000) AS photo_url,
    NULL::public.statut_compte AS statut,
    NULL::character varying(60) AS numero_ordre,
    NULL::public.statut_verification AS statut_verification,
    NULL::integer AS annees_experience,
    NULL::text AS biographie,
    NULL::numeric(10,2) AS tarif_consultation,
    NULL::public.devise_enum AS devise,
    NULL::numeric(3,2) AS note_moyenne,
    NULL::integer AS nombre_avis,
    NULL::integer AS nombre_consultations,
    NULL::boolean AS teleconsultation_active,
    NULL::boolean AS disponible_maintenant,
    NULL::character varying(300) AS structure_nom,
    NULL::character varying(100) AS structure_ville,
    NULL::character varying[] AS specialites,
    NULL::timestamp with time zone AS created_at;


ALTER VIEW public.v_medecins_complets OWNER TO postgres;

--
-- Name: VIEW v_medecins_complets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_medecins_complets IS 'Vue dÃ©normalisÃ©e pour afficher les profils mÃ©decins avec spÃ©cialitÃ©s agrÃ©gÃ©es.';


--
-- Name: v_stats_observateurs; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_stats_observateurs AS
 SELECT p.region,
    p.ville,
    sp.libelle_fr AS specialite,
    date_trunc('month'::text, rdv.date_heure_debut) AS mois,
    count(rdv.id) AS nb_consultations,
    count(
        CASE
            WHEN (rdv.type = 'video'::public.type_consultation) THEN 1
            ELSE NULL::integer
        END) AS nb_teleconsultations,
    round(avg(rdv.montant), 2) AS tarif_moyen_xaf,
    count(DISTINCT rdv.patient_id) AS patients_uniques
   FROM ((((public.rendez_vous rdv
     JOIN public.patients p ON ((p.id = rdv.patient_id)))
     JOIN public.medecins m ON ((m.id = rdv.medecin_id)))
     JOIN public.medecin_specialites ms ON (((ms.medecin_id = m.id) AND (ms.principale = true))))
     JOIN public.specialites sp ON ((sp.id = ms.specialite_id)))
  WHERE (rdv.statut = 'termine'::public.statut_rdv)
  GROUP BY p.region, p.ville, sp.libelle_fr, (date_trunc('month'::text, rdv.date_heure_debut))
  ORDER BY (date_trunc('month'::text, rdv.date_heure_debut)) DESC;


ALTER VIEW public.v_stats_observateurs OWNER TO postgres;

--
-- Name: VIEW v_stats_observateurs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.v_stats_observateurs IS 'Statistiques sanitaires anonymisÃ©es pour les observateurs institutionnels. Aucune donnÃ©e individuelle exposÃ©e.';


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: avis avis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_pkey PRIMARY KEY (id);


--
-- Name: avis avis_rdv_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_rdv_id_key UNIQUE (rdv_id);


--
-- Name: chatbot_sessions chatbot_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_sessions
    ADD CONSTRAINT chatbot_sessions_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_numero_consultation_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_numero_consultation_key UNIQUE (numero_consultation);


--
-- Name: consultations consultations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_pkey PRIMARY KEY (id);


--
-- Name: consultations consultations_rdv_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_rdv_id_key UNIQUE (rdv_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: disponibilites disponibilites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disponibilites
    ADD CONSTRAINT disponibilites_pkey PRIMARY KEY (id);


--
-- Name: documents_medicaux documents_medicaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_medicaux
    ADD CONSTRAINT documents_medicaux_pkey PRIMARY KEY (id);


--
-- Name: dossiers_medicaux dossiers_medicaux_code_partage_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_code_partage_key UNIQUE (code_partage);


--
-- Name: dossiers_medicaux dossiers_medicaux_numero_dossier_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_numero_dossier_key UNIQUE (numero_dossier);


--
-- Name: dossiers_medicaux dossiers_medicaux_patient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_patient_id_key UNIQUE (patient_id);


--
-- Name: dossiers_medicaux dossiers_medicaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_pkey PRIMARY KEY (id);


--
-- Name: medecin_specialites medecin_specialites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecin_specialites
    ADD CONSTRAINT medecin_specialites_pkey PRIMARY KEY (medecin_id, specialite_id);


--
-- Name: medecins medecins_numero_ordre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_numero_ordre_key UNIQUE (numero_ordre);


--
-- Name: medecins medecins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ordonnance_lignes ordonnance_lignes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnance_lignes
    ADD CONSTRAINT ordonnance_lignes_pkey PRIMARY KEY (id);


--
-- Name: ordonnances ordonnances_code_pharmacie_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_code_pharmacie_key UNIQUE (code_pharmacie);


--
-- Name: ordonnances ordonnances_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_numero_key UNIQUE (numero);


--
-- Name: ordonnances ordonnances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_pkey PRIMARY KEY (id);


--
-- Name: paiements paiements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_pkey PRIMARY KEY (id);


--
-- Name: paiements paiements_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_reference_key UNIQUE (reference);


--
-- Name: patients patients_numero_patient_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_numero_patient_key UNIQUE (numero_patient);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: rendez_vous rendez_vous_numero_rdv_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_numero_rdv_key UNIQUE (numero_rdv);


--
-- Name: rendez_vous rendez_vous_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: specialites specialites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT specialites_pkey PRIMARY KEY (id);


--
-- Name: structures structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_pkey PRIMARY KEY (id);


--
-- Name: conversations uq_conversation_rdv; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT uq_conversation_rdv UNIQUE (patient_id, medecin_id, rdv_id);


--
-- Name: specialites uq_specialites_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialites
    ADD CONSTRAINT uq_specialites_code UNIQUE (code);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: users uq_users_telephone; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_telephone UNIQUE (telephone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_action ON public.audit_logs USING btree (action, created_at DESC);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_date ON public.audit_logs USING btree (created_at DESC);


--
-- Name: idx_audit_entite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_entite ON public.audit_logs USING btree (entite_type, entite_id);


--
-- Name: idx_audit_succes; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_succes ON public.audit_logs USING btree (succes) WHERE (succes = false);


--
-- Name: idx_audit_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_utilisateur ON public.audit_logs USING btree (utilisateur_id, created_at DESC);


--
-- Name: idx_avis_medecin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avis_medecin ON public.avis USING btree (medecin_id, verifie, note);


--
-- Name: idx_avis_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_avis_patient ON public.avis USING btree (patient_id);


--
-- Name: idx_chatbot_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chatbot_patient ON public.chatbot_sessions USING btree (patient_id, created_at DESC);


--
-- Name: idx_chatbot_urgence; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chatbot_urgence ON public.chatbot_sessions USING btree (niveau_urgence) WHERE (niveau_urgence = ANY (ARRAY['eleve'::public.niveau_urgence, 'urgence_vitale'::public.niveau_urgence]));


--
-- Name: idx_consultations_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_date ON public.consultations USING btree (date_heure_debut DESC);


--
-- Name: idx_consultations_diagnostic_fts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_diagnostic_fts ON public.consultations USING gin (to_tsvector('french'::regconfig, COALESCE(diagnostic_principal, ''::text)));


--
-- Name: idx_consultations_dossier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_dossier ON public.consultations USING btree (dossier_id);


--
-- Name: idx_consultations_medecin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_medecin ON public.consultations USING btree (medecin_id, date_heure_debut DESC);


--
-- Name: idx_consultations_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consultations_patient ON public.consultations USING btree (patient_id, date_heure_debut DESC);


--
-- Name: idx_conv_medecin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conv_medecin ON public.conversations USING btree (medecin_id, dernier_message_at DESC);


--
-- Name: idx_conv_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conv_patient ON public.conversations USING btree (patient_id, dernier_message_at DESC);


--
-- Name: idx_dispo_actif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispo_actif ON public.disponibilites USING btree (actif, medecin_id) WHERE (actif = true);


--
-- Name: idx_dispo_jour; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispo_jour ON public.disponibilites USING btree (jour_semaine);


--
-- Name: idx_dispo_medecin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dispo_medecin ON public.disponibilites USING btree (medecin_id);


--
-- Name: idx_docs_consultation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_docs_consultation ON public.documents_medicaux USING btree (consultation_id);


--
-- Name: idx_docs_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_docs_patient ON public.documents_medicaux USING btree (patient_id, created_at DESC);


--
-- Name: idx_docs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_docs_type ON public.documents_medicaux USING btree (type_document);


--
-- Name: idx_dossiers_medecin_traitant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dossiers_medecin_traitant ON public.dossiers_medicaux USING btree (medecin_traitant_id);


--
-- Name: idx_dossiers_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dossiers_patient ON public.dossiers_medicaux USING btree (patient_id);


--
-- Name: idx_medecin_spec_principale; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecin_spec_principale ON public.medecin_specialites USING btree (principale) WHERE (principale = true);


--
-- Name: idx_medecin_spec_specialite; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecin_spec_specialite ON public.medecin_specialites USING btree (specialite_id);


--
-- Name: idx_medecins_note; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecins_note ON public.medecins USING btree (note_moyenne DESC);


--
-- Name: idx_medecins_statut_verif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecins_statut_verif ON public.medecins USING btree (statut_verification);


--
-- Name: idx_medecins_tarif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecins_tarif ON public.medecins USING btree (tarif_consultation);


--
-- Name: idx_medecins_teleconsult; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_medecins_teleconsult ON public.medecins USING btree (teleconsultation_active) WHERE (teleconsultation_active = true);


--
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);


--
-- Name: idx_messages_expediteur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_expediteur ON public.messages USING btree (expediteur_id);


--
-- Name: idx_messages_non_lus; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_non_lus ON public.messages USING btree (conversation_id, lu_par_destinataire) WHERE (lu_par_destinataire = false);


--
-- Name: idx_notif_non_lues; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_non_lues ON public.notifications USING btree (utilisateur_id, statut) WHERE (statut = 'envoye'::public.statut_notification);


--
-- Name: idx_notif_planifie; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_planifie ON public.notifications USING btree (date_envoi_planifie, statut) WHERE (statut = 'en_attente'::public.statut_notification);


--
-- Name: idx_notif_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notif_utilisateur ON public.notifications USING btree (utilisateur_id, statut, created_at DESC);


--
-- Name: idx_ord_lignes_ordonnance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ord_lignes_ordonnance ON public.ordonnance_lignes USING btree (ordonnance_id);


--
-- Name: idx_ordonnances_code_pharma; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordonnances_code_pharma ON public.ordonnances USING btree (code_pharmacie);


--
-- Name: idx_ordonnances_consultation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordonnances_consultation ON public.ordonnances USING btree (consultation_id);


--
-- Name: idx_ordonnances_expiration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordonnances_expiration ON public.ordonnances USING btree (date_expiration) WHERE (statut = 'active'::public.statut_ordonnance);


--
-- Name: idx_ordonnances_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordonnances_patient ON public.ordonnances USING btree (patient_id, date_emission DESC);


--
-- Name: idx_ordonnances_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ordonnances_statut ON public.ordonnances USING btree (statut);


--
-- Name: idx_paiements_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paiements_created ON public.paiements USING btree (created_at DESC);


--
-- Name: idx_paiements_fournisseur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paiements_fournisseur ON public.paiements USING btree (fournisseur, statut);


--
-- Name: idx_paiements_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paiements_patient ON public.paiements USING btree (patient_id);


--
-- Name: idx_paiements_rdv; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paiements_rdv ON public.paiements USING btree (rdv_id);


--
-- Name: idx_paiements_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paiements_statut ON public.paiements USING btree (statut);


--
-- Name: idx_patients_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_numero ON public.patients USING btree (numero_patient);


--
-- Name: idx_patients_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_region ON public.patients USING btree (region);


--
-- Name: idx_patients_ville; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_patients_ville ON public.patients USING btree (ville);


--
-- Name: idx_rdv_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rdv_date ON public.rendez_vous USING btree (date_heure_debut);


--
-- Name: idx_rdv_medecin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rdv_medecin ON public.rendez_vous USING btree (medecin_id, date_heure_debut DESC);


--
-- Name: idx_rdv_no_overlap; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_rdv_no_overlap ON public.rendez_vous USING btree (medecin_id, date_heure_debut) WHERE (statut <> ALL (ARRAY['annule_patient'::public.statut_rdv, 'annule_medecin'::public.statut_rdv, 'annule_systeme'::public.statut_rdv]));


--
-- Name: idx_rdv_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rdv_numero ON public.rendez_vous USING btree (numero_rdv);


--
-- Name: idx_rdv_patient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rdv_patient ON public.rendez_vous USING btree (patient_id, date_heure_debut DESC);


--
-- Name: idx_rdv_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rdv_statut ON public.rendez_vous USING btree (statut);


--
-- Name: idx_sessions_expiration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expiration ON public.sessions USING btree (expires_at) WHERE (revoque = false);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_token ON public.sessions USING btree (refresh_token_hash);


--
-- Name: idx_sessions_utilisateur; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_utilisateur ON public.sessions USING btree (utilisateur_id, revoque);


--
-- Name: idx_specialites_actif; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_specialites_actif ON public.specialites USING btree (actif);


--
-- Name: idx_structures_region; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structures_region ON public.structures USING btree (region);


--
-- Name: idx_structures_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structures_type ON public.structures USING btree (type);


--
-- Name: idx_structures_ville; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_structures_ville ON public.structures USING btree (ville);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role) WHERE (deleted_at IS NULL);


--
-- Name: idx_users_statut; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_statut ON public.users USING btree (statut);


--
-- Name: v_medecins_complets _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_medecins_complets AS
 SELECT u.id,
    (((u.nom)::text || ' '::text) || (u.prenom)::text) AS nom_complet,
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
    array_agg(DISTINCT sp.libelle_fr) FILTER (WHERE (sp.id IS NOT NULL)) AS specialites,
    u.created_at
   FROM ((((public.users u
     JOIN public.medecins m ON ((m.id = u.id)))
     LEFT JOIN public.structures s ON ((s.id = m.structure_id)))
     LEFT JOIN public.medecin_specialites ms ON ((ms.medecin_id = m.id)))
     LEFT JOIN public.specialites sp ON ((sp.id = ms.specialite_id)))
  WHERE (u.deleted_at IS NULL)
  GROUP BY u.id, m.id, s.nom_etablissement, s.ville;


--
-- Name: consultations trg_audit_consultations; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_consultations AFTER INSERT OR DELETE OR UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: dossiers_medicaux trg_audit_dossiers; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_dossiers AFTER INSERT OR DELETE OR UPDATE ON public.dossiers_medicaux FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: ordonnances trg_audit_ordonnances; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_ordonnances AFTER INSERT OR DELETE OR UPDATE ON public.ordonnances FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: paiements trg_audit_paiements; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_paiements AFTER INSERT OR DELETE OR UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: patients trg_audit_patients; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_patients AFTER INSERT OR DELETE OR UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: rendez_vous trg_audit_rendez_vous; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_audit_rendez_vous AFTER INSERT OR DELETE OR UPDATE ON public.rendez_vous FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


--
-- Name: avis trg_avis_update_note; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_avis_update_note AFTER INSERT OR DELETE OR UPDATE ON public.avis FOR EACH ROW EXECUTE FUNCTION public.fn_update_note_medecin();


--
-- Name: avis trg_avis_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_avis_updated_at BEFORE UPDATE ON public.avis FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: chatbot_sessions trg_chatbot_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_chatbot_updated_at BEFORE UPDATE ON public.chatbot_sessions FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: consultations trg_consultation_duree; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_consultation_duree BEFORE INSERT OR UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.fn_calc_duree_consultation();


--
-- Name: consultations trg_consultation_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_consultation_numero BEFORE INSERT ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.fn_generate_consultation_numero();


--
-- Name: consultations trg_consultations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: conversations trg_conv_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_conv_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: disponibilites trg_disponibilites_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_disponibilites_updated_at BEFORE UPDATE ON public.disponibilites FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: documents_medicaux trg_docs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_docs_updated_at BEFORE UPDATE ON public.documents_medicaux FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: dossiers_medicaux trg_dossier_calc_imc; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_dossier_calc_imc BEFORE INSERT OR UPDATE ON public.dossiers_medicaux FOR EACH ROW EXECUTE FUNCTION public.fn_calc_imc();


--
-- Name: dossiers_medicaux trg_dossier_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_dossier_numero BEFORE INSERT ON public.dossiers_medicaux FOR EACH ROW EXECUTE FUNCTION public.fn_generate_dossier_numero();


--
-- Name: dossiers_medicaux trg_dossiers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_dossiers_updated_at BEFORE UPDATE ON public.dossiers_medicaux FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: medecins trg_medecins_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_medecins_updated_at BEFORE UPDATE ON public.medecins FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: ordonnances trg_ordonnance_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ordonnance_numero BEFORE INSERT ON public.ordonnances FOR EACH ROW EXECUTE FUNCTION public.fn_generate_ordonnance_numero();


--
-- Name: ordonnances trg_ordonnances_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_ordonnances_updated_at BEFORE UPDATE ON public.ordonnances FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: paiements trg_paiements_calc_montant; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_paiements_calc_montant BEFORE INSERT OR UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.fn_calc_montant_medecin();


--
-- Name: paiements trg_paiements_reference; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_paiements_reference BEFORE INSERT ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.fn_generate_paiement_reference();


--
-- Name: paiements trg_paiements_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_paiements_updated_at BEFORE UPDATE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: patients trg_patient_create_dossier; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_patient_create_dossier AFTER INSERT ON public.patients FOR EACH ROW EXECUTE FUNCTION public.fn_create_dossier_on_patient();


--
-- Name: patients trg_patients_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: rendez_vous trg_rdv_numero; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_rdv_numero BEFORE INSERT ON public.rendez_vous FOR EACH ROW EXECUTE FUNCTION public.fn_generate_rdv_numero();


--
-- Name: rendez_vous trg_rdv_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_rdv_updated_at BEFORE UPDATE ON public.rendez_vous FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: structures trg_structures_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_structures_updated_at BEFORE UPDATE ON public.structures FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();


--
-- Name: audit_logs audit_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: avis avis_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE CASCADE;


--
-- Name: avis avis_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: avis avis_rdv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_rdv_id_fkey FOREIGN KEY (rdv_id) REFERENCES public.rendez_vous(id) ON DELETE CASCADE;


--
-- Name: avis avis_verifie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avis
    ADD CONSTRAINT avis_verifie_par_fkey FOREIGN KEY (verifie_par) REFERENCES public.users(id);


--
-- Name: chatbot_sessions chatbot_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_sessions
    ADD CONSTRAINT chatbot_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: chatbot_sessions chatbot_sessions_rdv_cree_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_sessions
    ADD CONSTRAINT chatbot_sessions_rdv_cree_id_fkey FOREIGN KEY (rdv_cree_id) REFERENCES public.rendez_vous(id) ON DELETE SET NULL;


--
-- Name: consultations consultations_dossier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_dossier_id_fkey FOREIGN KEY (dossier_id) REFERENCES public.dossiers_medicaux(id) ON DELETE RESTRICT;


--
-- Name: consultations consultations_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE RESTRICT;


--
-- Name: consultations consultations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: consultations consultations_rdv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT consultations_rdv_id_fkey FOREIGN KEY (rdv_id) REFERENCES public.rendez_vous(id) ON DELETE RESTRICT;


--
-- Name: conversations conversations_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_rdv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_rdv_id_fkey FOREIGN KEY (rdv_id) REFERENCES public.rendez_vous(id) ON DELETE SET NULL;


--
-- Name: disponibilites disponibilites_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disponibilites
    ADD CONSTRAINT disponibilites_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE CASCADE;


--
-- Name: documents_medicaux documents_medicaux_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_medicaux
    ADD CONSTRAINT documents_medicaux_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE SET NULL;


--
-- Name: documents_medicaux documents_medicaux_medecin_uploadeur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_medicaux
    ADD CONSTRAINT documents_medicaux_medecin_uploadeur_id_fkey FOREIGN KEY (medecin_uploadeur_id) REFERENCES public.medecins(id) ON DELETE SET NULL;


--
-- Name: documents_medicaux documents_medicaux_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_medicaux
    ADD CONSTRAINT documents_medicaux_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: documents_medicaux documents_medicaux_uploaded_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents_medicaux
    ADD CONSTRAINT documents_medicaux_uploaded_par_fkey FOREIGN KEY (uploaded_par) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: dossiers_medicaux dossiers_medicaux_medecin_traitant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_medecin_traitant_id_fkey FOREIGN KEY (medecin_traitant_id) REFERENCES public.medecins(id) ON DELETE SET NULL;


--
-- Name: dossiers_medicaux dossiers_medicaux_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dossiers_medicaux
    ADD CONSTRAINT dossiers_medicaux_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: medecins fk_medecins_structure; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT fk_medecins_structure FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE SET NULL;


--
-- Name: medecin_specialites medecin_specialites_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecin_specialites
    ADD CONSTRAINT medecin_specialites_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE CASCADE;


--
-- Name: medecin_specialites medecin_specialites_specialite_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecin_specialites
    ADD CONSTRAINT medecin_specialites_specialite_id_fkey FOREIGN KEY (specialite_id) REFERENCES public.specialites(id) ON DELETE RESTRICT;


--
-- Name: medecins medecins_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: medecins medecins_verifie_par_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medecins
    ADD CONSTRAINT medecins_verifie_par_admin_id_fkey FOREIGN KEY (verifie_par_admin_id) REFERENCES public.users(id);


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: notifications notifications_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ordonnance_lignes ordonnance_lignes_ordonnance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnance_lignes
    ADD CONSTRAINT ordonnance_lignes_ordonnance_id_fkey FOREIGN KEY (ordonnance_id) REFERENCES public.ordonnances(id) ON DELETE CASCADE;


--
-- Name: ordonnances ordonnances_consultation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE RESTRICT;


--
-- Name: ordonnances ordonnances_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE RESTRICT;


--
-- Name: ordonnances ordonnances_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordonnances
    ADD CONSTRAINT ordonnances_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: paiements paiements_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE RESTRICT;


--
-- Name: paiements paiements_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: paiements paiements_rdv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_rdv_id_fkey FOREIGN KEY (rdv_id) REFERENCES public.rendez_vous(id) ON DELETE RESTRICT;


--
-- Name: patients patients_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rendez_vous rendez_vous_annule_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_annule_par_fkey FOREIGN KEY (annule_par) REFERENCES public.users(id);


--
-- Name: rendez_vous rendez_vous_medecin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_medecin_id_fkey FOREIGN KEY (medecin_id) REFERENCES public.medecins(id) ON DELETE RESTRICT;


--
-- Name: rendez_vous rendez_vous_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;


--
-- Name: rendez_vous rendez_vous_structure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rendez_vous
    ADD CONSTRAINT rendez_vous_structure_id_fkey FOREIGN KEY (structure_id) REFERENCES public.structures(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: structures structures_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.structures
    ADD CONSTRAINT structures_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: consultations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

--
-- Name: dossiers_medicaux; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.dossiers_medicaux ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: ordonnances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.ordonnances ENABLE ROW LEVEL SECURITY;

--
-- Name: paiements; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: dossiers_medicaux pol_dossiers_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_dossiers_own ON public.dossiers_medicaux USING (((patient_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: patients pol_patients_own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pol_patients_own ON public.patients USING (((id)::text = current_setting('app.current_user_id'::text, true)));


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO nere_app;
GRANT USAGE ON SCHEMA public TO nere_readonly;


--
-- Name: FUNCTION gtrgm_in(cstring); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO nere_app;


--
-- Name: FUNCTION gtrgm_out(public.gtrgm); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_out(public.gtrgm) TO nere_app;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.armor(bytea) TO nere_app;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.armor(bytea, text[], text[]) TO nere_app;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.crypt(text, text) TO nere_app;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.dearmor(text) TO nere_app;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decrypt(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.decrypt_iv(bytea, bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.digest(bytea, text) TO nere_app;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.digest(text, text) TO nere_app;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.encrypt(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.encrypt_iv(bytea, bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION fn_audit_trigger(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_audit_trigger() TO nere_app;


--
-- Name: FUNCTION fn_calc_duree_consultation(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_calc_duree_consultation() TO nere_app;


--
-- Name: FUNCTION fn_calc_imc(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_calc_imc() TO nere_app;


--
-- Name: FUNCTION fn_calc_montant_medecin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_calc_montant_medecin() TO nere_app;


--
-- Name: FUNCTION fn_create_dossier_on_patient(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_create_dossier_on_patient() TO nere_app;


--
-- Name: FUNCTION fn_generate_consultation_numero(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_consultation_numero() TO nere_app;


--
-- Name: FUNCTION fn_generate_dossier_numero(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_dossier_numero() TO nere_app;


--
-- Name: FUNCTION fn_generate_numero(prefix text, seq_name text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_numero(prefix text, seq_name text) TO nere_app;


--
-- Name: FUNCTION fn_generate_ordonnance_numero(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_ordonnance_numero() TO nere_app;


--
-- Name: FUNCTION fn_generate_paiement_reference(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_paiement_reference() TO nere_app;


--
-- Name: FUNCTION fn_generate_rdv_numero(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_generate_rdv_numero() TO nere_app;


--
-- Name: FUNCTION fn_rechercher_medecins(p_terme text, p_specialite_code character varying, p_ville character varying, p_tarif_max numeric, p_disponible_maintenant boolean); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_rechercher_medecins(p_terme text, p_specialite_code character varying, p_ville character varying, p_tarif_max numeric, p_disponible_maintenant boolean) TO nere_app;


--
-- Name: FUNCTION fn_set_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_set_updated_at() TO nere_app;


--
-- Name: FUNCTION fn_stats_patient(p_patient_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_stats_patient(p_patient_id uuid) TO nere_app;


--
-- Name: FUNCTION fn_update_note_medecin(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_update_note_medecin() TO nere_app;


--
-- Name: FUNCTION fn_verifier_disponibilite(p_medecin_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_verifier_disponibilite(p_medecin_id uuid, p_debut timestamp with time zone, p_fin timestamp with time zone) TO nere_app;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_random_bytes(integer) TO nere_app;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_random_uuid() TO nere_app;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_salt(text) TO nere_app;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gen_salt(text, integer) TO nere_app;


--
-- Name: FUNCTION gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) TO nere_app;


--
-- Name: FUNCTION gin_extract_value_trgm(text, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO nere_app;


--
-- Name: FUNCTION gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) TO nere_app;


--
-- Name: FUNCTION gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_compress(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_consistent(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_decompress(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_distance(internal, text, smallint, oid, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_options(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_penalty(internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_picksplit(internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_same(public.gtrgm, public.gtrgm, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_same(public.gtrgm, public.gtrgm, internal) TO nere_app;


--
-- Name: FUNCTION gtrgm_union(internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO nere_app;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hmac(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hmac(text, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_armor_headers(text, OUT key text, OUT value text) TO nere_app;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_key_id(bytea) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt(bytea, bytea, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea) TO nere_app;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt(text, bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea) TO nere_app;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_pub_encrypt_bytea(bytea, bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt(bytea, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_decrypt_bytea(bytea, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt(text, text, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text) TO nere_app;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pgp_sym_encrypt_bytea(bytea, text, text) TO nere_app;


--
-- Name: FUNCTION set_limit(real); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_limit(real) TO nere_app;


--
-- Name: FUNCTION show_limit(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.show_limit() TO nere_app;


--
-- Name: FUNCTION show_trgm(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.show_trgm(text) TO nere_app;


--
-- Name: FUNCTION similarity(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.similarity(text, text) TO nere_app;


--
-- Name: FUNCTION similarity_dist(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO nere_app;


--
-- Name: FUNCTION similarity_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.similarity_op(text, text) TO nere_app;


--
-- Name: FUNCTION strict_word_similarity(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO nere_app;


--
-- Name: FUNCTION strict_word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO nere_app;


--
-- Name: FUNCTION strict_word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO nere_app;


--
-- Name: FUNCTION strict_word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO nere_app;


--
-- Name: FUNCTION strict_word_similarity_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO nere_app;


--
-- Name: FUNCTION unaccent(text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.unaccent(text) TO nere_app;


--
-- Name: FUNCTION unaccent(regdictionary, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.unaccent(regdictionary, text) TO nere_app;


--
-- Name: FUNCTION unaccent_init(internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.unaccent_init(internal) TO nere_app;


--
-- Name: FUNCTION unaccent_lexize(internal, internal, internal, internal); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.unaccent_lexize(internal, internal, internal, internal) TO nere_app;


--
-- Name: FUNCTION word_similarity(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.word_similarity(text, text) TO nere_app;


--
-- Name: FUNCTION word_similarity_commutator_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO nere_app;


--
-- Name: FUNCTION word_similarity_dist_commutator_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO nere_app;


--
-- Name: FUNCTION word_similarity_dist_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO nere_app;


--
-- Name: FUNCTION word_similarity_op(text, text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO nere_app;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.audit_logs TO nere_readonly;
GRANT SELECT,INSERT ON TABLE public.audit_logs TO nere_app;


--
-- Name: SEQUENCE audit_logs_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.audit_logs_id_seq TO nere_app;


--
-- Name: TABLE avis; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.avis TO nere_app;
GRANT SELECT ON TABLE public.avis TO nere_readonly;


--
-- Name: TABLE chatbot_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.chatbot_sessions TO nere_app;
GRANT SELECT ON TABLE public.chatbot_sessions TO nere_readonly;


--
-- Name: TABLE consultations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.consultations TO nere_app;
GRANT SELECT ON TABLE public.consultations TO nere_readonly;


--
-- Name: TABLE conversations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.conversations TO nere_app;
GRANT SELECT ON TABLE public.conversations TO nere_readonly;


--
-- Name: TABLE disponibilites; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.disponibilites TO nere_app;
GRANT SELECT ON TABLE public.disponibilites TO nere_readonly;


--
-- Name: TABLE documents_medicaux; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.documents_medicaux TO nere_app;
GRANT SELECT ON TABLE public.documents_medicaux TO nere_readonly;


--
-- Name: TABLE dossiers_medicaux; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.dossiers_medicaux TO nere_app;
GRANT SELECT ON TABLE public.dossiers_medicaux TO nere_readonly;


--
-- Name: TABLE medecin_specialites; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.medecin_specialites TO nere_app;
GRANT SELECT ON TABLE public.medecin_specialites TO nere_readonly;


--
-- Name: TABLE medecins; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.medecins TO nere_app;
GRANT SELECT ON TABLE public.medecins TO nere_readonly;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.messages TO nere_app;
GRANT SELECT ON TABLE public.messages TO nere_readonly;


--
-- Name: TABLE notifications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.notifications TO nere_app;
GRANT SELECT ON TABLE public.notifications TO nere_readonly;


--
-- Name: TABLE ordonnance_lignes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ordonnance_lignes TO nere_app;
GRANT SELECT ON TABLE public.ordonnance_lignes TO nere_readonly;


--
-- Name: TABLE ordonnances; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ordonnances TO nere_app;
GRANT SELECT ON TABLE public.ordonnances TO nere_readonly;


--
-- Name: TABLE paiements; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.paiements TO nere_app;
GRANT SELECT ON TABLE public.paiements TO nere_readonly;


--
-- Name: TABLE patients; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.patients TO nere_app;
GRANT SELECT ON TABLE public.patients TO nere_readonly;


--
-- Name: TABLE rendez_vous; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.rendez_vous TO nere_app;
GRANT SELECT ON TABLE public.rendez_vous TO nere_readonly;


--
-- Name: SEQUENCE seq_consultation_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_consultation_numero TO nere_app;


--
-- Name: SEQUENCE seq_dossier_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_dossier_numero TO nere_app;


--
-- Name: SEQUENCE seq_ordonnance_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_ordonnance_numero TO nere_app;


--
-- Name: SEQUENCE seq_paiement_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_paiement_numero TO nere_app;


--
-- Name: SEQUENCE seq_patient_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_patient_numero TO nere_app;


--
-- Name: SEQUENCE seq_rdv_numero; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_rdv_numero TO nere_app;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sessions TO nere_app;
GRANT SELECT ON TABLE public.sessions TO nere_readonly;


--
-- Name: TABLE specialites; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.specialites TO nere_app;
GRANT SELECT ON TABLE public.specialites TO nere_readonly;


--
-- Name: TABLE structures; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.structures TO nere_app;
GRANT SELECT ON TABLE public.structures TO nere_readonly;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO nere_app;
GRANT SELECT ON TABLE public.users TO nere_readonly;


--
-- Name: TABLE v_dashboard_admin; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_dashboard_admin TO nere_app;
GRANT SELECT ON TABLE public.v_dashboard_admin TO nere_readonly;


--
-- Name: TABLE v_medecins_complets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_medecins_complets TO nere_app;
GRANT SELECT ON TABLE public.v_medecins_complets TO nere_readonly;


--
-- Name: TABLE v_stats_observateurs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.v_stats_observateurs TO nere_app;
GRANT SELECT ON TABLE public.v_stats_observateurs TO nere_readonly;


--
-- PostgreSQL database dump complete
--

