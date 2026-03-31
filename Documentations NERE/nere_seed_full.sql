-- Script d'injection massives pour database nere_db
-- Génère : 500 patients, 200 médecins, 400 RDV, 350 paiements, 350 consultations, 250 ordonnances
-- Exécuter dans le contexte de la base nere_db
-- 1) Créer des utilisateurs de test et structures
DO $$
DECLARE i INT;
uemail TEXT;
utel TEXT;
uid UUID;
med_id UUID;
str_id UUID;
BEGIN -- Structures de référence
FOR i IN 1..20 LOOP uemail := format('structure%s@nere.test', LPAD(i::TEXT, 3, '0'));
utel := format('+237690%s', LPAD((100000 + i)::TEXT, 6, '0'));
INSERT INTO users (
    email,
    telephone,
    mot_de_passe_hash,
    role,
    statut,
    nom,
    prenom,
    email_verifie
  )
VALUES (
    uemail,
    utel,
    'hash_test',
    'structure',
    'actif',
    'Structure',
    format('Test %s', i),
    TRUE
  ) ON CONFLICT (email) DO NOTHING;
END LOOP;
-- Patients
FOR i IN 1..500 LOOP uemail := format('patient%s@nere.test', LPAD(i::TEXT, 3, '0'));
utel := format('+237690%s', LPAD((200000 + i)::TEXT, 6, '0'));
INSERT INTO users (
    email,
    telephone,
    mot_de_passe_hash,
    role,
    statut,
    nom,
    prenom,
    email_verifie
  )
VALUES (
    uemail,
    utel,
    'hash_test',
    'patient',
    'actif',
    format('Patient%s', LPAD(i::TEXT, 3, '0')),
    'Test',
    TRUE
  ) ON CONFLICT (email) DO NOTHING;
END LOOP;
-- Médecins
FOR i IN 1..200 LOOP uemail := format('medecin%s@nere.test', LPAD(i::TEXT, 3, '0'));
utel := format('+237690%s', LPAD((300000 + i)::TEXT, 6, '0'));
INSERT INTO users (
    email,
    telephone,
    mot_de_passe_hash,
    role,
    statut,
    nom,
    prenom,
    email_verifie
  )
VALUES (
    uemail,
    utel,
    'hash_test',
    'medecin',
    'actif',
    format('Medecin%s', LPAD(i::TEXT, 3, '0')),
    'Test',
    TRUE
  ) ON CONFLICT (email) DO NOTHING;
END LOOP;
-- Observateur + admin
INSERT INTO users (
    email,
    telephone,
    mot_de_passe_hash,
    role,
    statut,
    nom,
    prenom,
    email_verifie
  )
VALUES (
    'admin@nere.test',
    '+237690999001',
    'hash_test',
    'admin',
    'actif',
    'Admin',
    'Nere',
    TRUE
  ),
  (
    'observateur@nere.test',
    '+237690999002',
    'hash_test',
    'observateur',
    'actif',
    'Observateur',
    'Test',
    TRUE
  ) ON CONFLICT (email) DO NOTHING;
END $$;
-- 2) Insérer dans structures, patients, médecins
DO $$
DECLARE rec RECORD;
specialite_uuid UUID;
str_id UUID;
i INT;
BEGIN -- structures
FOR rec IN
SELECT id
FROM users
WHERE role = 'structure' LOOP
INSERT INTO structures (
    id,
    nom_etablissement,
    type,
    statut_verification,
    adresse,
    ville,
    region,
    pays,
    telephone_pro,
    email_pro,
    description,
    services_offerts,
    capacite_lits
  )
VALUES (
    rec.id,
    'Clinique ' || LEFT(md5(rec.id::text), 8),
    'clinique',
    'verifie',
    'Av. Central, Douala',
    'Douala',
    'Littoral',
    'CM',
    '+237697000000',
    'structure@nere.test',
    'Clinique de test',
    ARRAY ['consultation','teleconsultation'],
    100
  ) ON CONFLICT (id) DO NOTHING;
END LOOP;
-- patients
FOR rec IN
SELECT id,
  email
FROM users
WHERE role = 'patient' LOOP
INSERT INTO patients (
    id,
    numero_patient,
    date_naissance,
    sexe,
    ville,
    region,
    pays,
    taille_cm,
    poids_kg,
    allergies,
    antecedents_medicaux,
    medicaments_en_cours,
    couverture_assurance,
    contact_urgence_nom,
    contact_urgence_tel,
    consentement_donnees
  )
VALUES (
    rec.id,
    'NER-PAT-' || LEFT(md5(rec.email), 10),
    DATE '1985-01-01' + (random() * 9000)::INT,
    'M',
    'Douala',
    'Littoral',
    'CM',
    170 + (random() * 20)::NUMERIC,
    60 + (random() * 30)::NUMERIC,
    ARRAY ['penicilline'],
    'aucun',
    'aucun',
    'AXA',
    'Contact Urgence',
    '+237690000000',
    TRUE
  ) ON CONFLICT (id) DO NOTHING;
END LOOP;
-- médecins
FOR rec IN
SELECT id,
  email
FROM users
WHERE role = 'medecin' LOOP
INSERT INTO medecins (
    id,
    numero_ordre,
    statut_verification,
    annees_experience,
    biographie,
    diplomes,
    certifications,
    langues_parlees,
    tarif_consultation,
    devise,
    teleconsultation_active,
    disponible_maintenant
  )
VALUES (
    rec.id,
    'ONMC-' || LEFT(md5(rec.email), 10),
    'verifie',
    (random() * 20)::INT,
    'Médecin expert Néré',
    '[{"titre":"Doctorat","institution":"Fac Médecine"}]',
    '[{"titre":"Certificat"}]',
    ARRAY ['fr'],
    12000 + (random() * 15000)::NUMERIC,
    'XAF',
    TRUE,
    TRUE
  ) ON CONFLICT (id) DO NOTHING;
END LOOP;
-- Médecin spécialités (au moins 1 par médecin)
SELECT id INTO specialite_uuid
FROM specialites
LIMIT 1;
IF specialite_uuid IS NULL THEN RAISE EXCEPTION 'Aucune specialite trouvée dans specialites';
END IF;
FOR rec IN
SELECT id
FROM medecins LOOP
INSERT INTO medecin_specialites (
    medecin_id,
    specialite_id,
    principale,
    annees_pratique,
    certifie
  )
VALUES (
    rec.id,
    specialite_uuid,
    TRUE,
    (random() * 20)::INT,
    TRUE
  ) ON CONFLICT (medecin_id, specialite_id) DO NOTHING;
END LOOP;
-- Tomber sur la première structure (si existante) pour rattacher
SELECT id INTO str_id
FROM structures
LIMIT 1;
IF str_id IS NOT NULL THEN
UPDATE medecins
SET structure_id = str_id
WHERE structure_id IS NULL;
END IF;
END $$;
-- 3) Disponibilités médecins
DO $$
DECLARE rec RECORD;
jours TEXT [] := ARRAY ['lundi','mardi','mercredi','jeudi','vendredi'];
j INT;
BEGIN FOR rec IN
SELECT id
FROM medecins LOOP j := (floor(random() * array_length(jours, 1)) + 1)::INT;
INSERT INTO disponibilites (
    medecin_id,
    jour_semaine,
    heure_debut,
    heure_fin,
    duree_creneau_minutes,
    type_consultation,
    recurrence,
    date_debut_validite,
    actif
  )
VALUES (
    rec.id,
    jours [j]::jour_semaine,
    '08:00'::time,
    '16:00'::time,
    30,
    'video',
    'hebdomadaire',
    CURRENT_DATE,
    TRUE
  ) ON CONFLICT DO NOTHING;
END LOOP;
END $$;
-- 4) Rendez-vous massifs (400)
DO $$
DECLARE p RECORD;
m RECORD;
count_rdv INT := 0;
dt TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '1 day';
BEGIN FOR p IN
SELECT id
FROM patients
LIMIT 200 LOOP FOR m IN
SELECT id
FROM medecins
ORDER BY RANDOM()
LIMIT 2 LOOP EXIT
  WHEN count_rdv >= 400;
INSERT INTO rendez_vous (
    numero_rdv,
    patient_id,
    medecin_id,
    structure_id,
    date_heure_debut,
    date_heure_fin,
    type,
    statut,
    motif_consultation,
    montant,
    devise
  )
VALUES (
    'NER-RDV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((count_rdv + 1)::TEXT, 4, '0'),
    p.id,
    m.id,
    (
      SELECT id
      FROM structures
      LIMIT 1
    ), dt + INTERVAL '1 hour',
    dt + INTERVAL '1 hour 30 minutes',
    'video',
    CASE
      WHEN random() < 0.90 THEN 'termine'::statut_rdv
      ELSE 'confirme'::statut_rdv
    END,
    'Consultation de routine',
    12000 + floor(random() * 8000),
    'XAF'
  ) ON CONFLICT (numero_rdv) DO NOTHING;
count_rdv := count_rdv + 1;
dt := dt + INTERVAL '2 hours';
END LOOP;
END LOOP;
END $$;
-- 5) Paiements (350) + consultations (350)
DO $$
DECLARE rd RECORD;
d RECORD;
idx INT := 0;
BEGIN FOR rd IN
SELECT id,
  patient_id,
  medecin_id,
  montant
FROM rendez_vous
WHERE statut = 'termine'
ORDER BY date_heure_debut
LIMIT 350 LOOP
INSERT INTO paiements (
    rdv_id,
    patient_id,
    medecin_id,
    montant_total,
    devise,
    frais_plateforme,
    taux_commission,
    methode,
    fournisseur,
    ip_paiement,
    statut
  )
VALUES (
    rd.id,
    rd.patient_id,
    rd.medecin_id,
    rd.montant,
    'XAF',
    ROUND(rd.montant * 0.1, 2),
    0.1,
    'mtn_momo',
    'cinetpay',
    '10.1.1.1',
    'confirme'
  ) ON CONFLICT (rdv_id) DO NOTHING;
-- Consultation
INSERT INTO consultations (
    rdv_id,
    dossier_id,
    medecin_id,
    patient_id,
    date_heure_debut,
    date_heure_fin,
    motive,
    anamnese,
    examen_clinique,
    diagnostic_principal,
    code_cim10,
    plan_traitement,
    statut
  )
SELECT rd.id,
  d.id,
  rd.medecin_id,
  rd.patient_id,
  NOW(),
  NOW() + INTERVAL '25 minutes',
  'Fatigue persistante',
  'Symptômes de fatigue',
  'Examen normal',
  'Anémie',
  'D64.9',
  'Suppléments de fer',
  'terminee'
FROM dossiers_medicaux d
WHERE d.patient_id = rd.patient_id
LIMIT 1 ON CONFLICT (rdv_id) DO NOTHING;
idx := idx + 1;
END LOOP;
-- Ordonnances (250) basées sur consultations
FOR d IN
SELECT id,
  medecin_id,
  patient_id
FROM consultations
ORDER BY created_at
LIMIT 250 LOOP
INSERT INTO ordonnances (
    consultation_id,
    medecin_id,
    patient_id,
    date_emission,
    date_expiration,
    qr_code_data,
    qr_code_url,
    pdf_url,
    notes_medecin
  )
VALUES (
    d.consultation_id,
    d.medecin_id,
    d.patient_id,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    'QR' || LEFT(md5(d.id::text), 12),
    'https://fakeurl/qr/' || LEFT(md5(d.id::text), 12),
    'https://fakeurl/pdf/' || LEFT(md5(d.id::text), 12),
    'Prise 1 fois par jour'
  ) ON CONFLICT (consultation_id) DO NOTHING;
END LOOP;
-- Lignes d'ordonnance (1 ou 2 lignes par ordonnance)
INSERT INTO ordonnance_lignes (
    ordonnance_id,
    ordre,
    medicament_nom,
    dci,
    classe_therapeutique,
    dosage,
    forme,
    posologie,
    frequence_par_jour,
    duree_jours,
    quantite
  )
SELECT o.id,
  1,
  'Paracétamol',
  'Paracetamol',
  'Antalgique',
  '500mg',
  'comprimes',
  '1 comprimé 3 fois par jour',
  3,
  7,
  21
FROM ordonnances o
LIMIT 250;
END $$;
-- 6) Vérification et tests automatisés (contrôles d'intégrité)
-- 6.1 Comptages attendus
SELECT 'patients' AS categorie,
  COUNT(*) AS n
FROM patients;
SELECT 'medecins' AS categorie,
  COUNT(*) AS n
FROM medecins;
SELECT 'rendez_vous' AS categorie,
  COUNT(*) AS n
FROM rendez_vous;
SELECT 'paiements' AS categorie,
  COUNT(*) AS n
FROM paiements;
SELECT 'consultations' AS categorie,
  COUNT(*) AS n
FROM consultations;
SELECT 'ordonnances' AS categorie,
  COUNT(*) AS n
FROM ordonnances;
SELECT 'ordonnances_lignes' AS categorie,
  COUNT(*) AS n
FROM ordonnance_lignes;
-- 6.2 Vérifier clés étrangères
SELECT COUNT(*) AS invalid_consultations
FROM consultations c
  LEFT JOIN rendez_vous r ON c.rdv_id = r.id
WHERE r.id IS NULL;
-- 6.3 Vérifier montants paiements
SELECT COUNT(*) AS paiements_cas_incoherents
FROM paiements
WHERE montant_medecin IS NULL
  OR montant_medecin <> montant_total - frais_plateforme;
-- 6.4 Vérifier triggers cues
SELECT MAX(created_at) AS dernier_audit
FROM audit_logs;
-- 6.5 Vérifier fonction disponibilité et recherche
SELECT fn_verifier_disponibilite(
    (
      SELECT id
      FROM medecins
      LIMIT 1
    ), NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day 30 minutes'
  );
SELECT *
FROM fn_stats_patient(
    (
      SELECT id
      FROM patients
      LIMIT 1
    )
  );
-- 6.6 Extraction rapide
SELECT *
FROM v_dashboard_admin;
SELECT *
FROM v_medecins_complets
LIMIT 5;
