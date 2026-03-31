-- seed_simple.sql
-- Step 1: create structures/patients/medecins from users
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
    capacite_lits,
    created_at,
    updated_at
  )
SELECT id,
  'Clinique ' || LEFT(md5(id::text), 8),
  'clinique',
  'verifie',
  'Av. Central',
  'Douala',
  'Littoral',
  'CM',
  '+237690000000',
  email,
  'Clinique test',
  ARRAY ['consultation','teleconsultation'],
  100,
  NOW(),
  NOW()
FROM users
WHERE role = 'structure' ON CONFLICT (id) DO NOTHING;
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
    consentement_donnees,
    created_at,
    updated_at
  )
SELECT id,
  'NER-PAT-' || LEFT(md5(email), 10),
  '1985-01-01',
  'M',
  'Douala',
  'Littoral',
  'CM',
  170,
  70,
  ARRAY ['penicilline'],
  'aucun',
  'aucun',
  'AXA',
  'Contact',
  '+237690000000',
  TRUE,
  NOW(),
  NOW()
FROM users
WHERE role = 'patient' ON CONFLICT (id) DO NOTHING;
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
    disponible_maintenant,
    created_at,
    updated_at
  )
SELECT id,
  'ONMC-' || LEFT(md5(email), 10),
  'verifie',
  8,
  'Médecin test',
  '[{"titre":"Doctorat"}]',
  '[{"titre":"Certificat"}]',
  ARRAY ['fr'],
  15000,
  'XAF',
  TRUE,
  TRUE,
  NOW(),
  NOW()
FROM users
WHERE role = 'medecin' ON CONFLICT (id) DO NOTHING;
-- Step 2: link specialties and disponibilites
INSERT INTO medecin_specialites (
    medecin_id,
    specialite_id,
    principale,
    annees_pratique,
    certifie,
    created_at
  )
SELECT m.id,
  s.id,
  TRUE,
  5,
  TRUE,
  NOW()
FROM medecins m
  CROSS JOIN LATERAL (
    SELECT id
    FROM specialites
    LIMIT 1
  ) s ON CONFLICT (medecin_id, specialite_id) DO NOTHING;
INSERT INTO disponibilites (
    medecin_id,
    jour_semaine,
    heure_debut,
    heure_fin,
    duree_creneau_minutes,
    type_consultation,
    recurrence,
    date_debut_validite,
    actif,
    created_at,
    updated_at
  )
SELECT id,
  'lundi',
  '08:00'::time,
  '12:00'::time,
  30,
  'video',
  'hebdomadaire',
  CURRENT_DATE,
  TRUE,
  NOW(),
  NOW()
FROM medecins ON CONFLICT DO NOTHING;
-- Step 3: create rendez-vous (400)
DO $$
DECLARE p RECORD;
m RECORD;
cnt INT := 0;
dt TIMESTAMP := NOW() + INTERVAL '1 day';
BEGIN FOR p IN
SELECT id
FROM patients
LIMIT 200 LOOP FOR m IN
SELECT id
FROM medecins
ORDER BY random()
LIMIT 2 LOOP EXIT
  WHEN cnt >= 400;
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
    devise,
    created_at,
    updated_at
  )
VALUES (
    'NER-RDV-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '-' || LPAD(cnt::text, 4, '0'),
    p.id,
    m.id,
    (
      SELECT id
      FROM structures
      LIMIT 1
    ), dt, dt + INTERVAL '25 minutes',
    'video',
    'termine',
    'Visite',
    12000,
    'XAF',
    NOW(),
    NOW()
  ) ON CONFLICT (numero_rdv) DO NOTHING;
cnt := cnt + 1;
dt := dt + INTERVAL '15 minutes';
END LOOP;
END LOOP;
END $$;
-- Step 4: create dossiers_medicaux for all patients
INSERT INTO dossiers_medicaux (
    id,
    patient_id,
    date_creation,
    historique_medical,
    allergies,
    medicaments,
    created_at,
    updated_at
  )
SELECT gen_random_uuid(),
  p.id,
  CURRENT_DATE,
  'Historique initial',
  ARRAY ['penicilline'],
  ARRAY ['paracetamol'],
  NOW(),
  NOW()
FROM patients p
WHERE NOT EXISTS (
    SELECT 1
    FROM dossiers_medicaux d
    WHERE d.patient_id = p.id
  );
-- Step 5: create paiements + consultations
DO $$
DECLARE r RECORD;
BEGIN FOR r IN
SELECT id,
  patient_id,
  medecin_id,
  montant
FROM rendez_vous
WHERE statut = 'termine'
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
    statut,
    created_at,
    updated_at
  )
VALUES (
    r.id,
    r.patient_id,
    r.medecin_id,
    COALESCE(r.montant, 12000),
    'XAF',
    1200,
    0.1,
    'mtn_momo',
    'cinetpay',
    'confirme',
    NOW(),
    NOW()
  );
INSERT INTO consultations (
    rdv_id,
    dossier_id,
    medecin_id,
    patient_id,
    date_heure_debut,
    date_heure_fin,
    motif,
    anamnese,
    diagnostic_principal,
    code_cim10,
    plan_traitement,
    statut,
    created_at,
    updated_at
  )
SELECT r.id,
  d.id,
  r.medecin_id,
  r.patient_id,
  NOW(),
  NOW() + INTERVAL '20 minutes',
  'Symptomes',
  'Exam',
  'Diagnostic',
  'Z00',
  'Traitement',
  'terminee',
  NOW(),
  NOW()
FROM dossiers_medicaux d
WHERE d.patient_id = r.patient_id
LIMIT 1 ON CONFLICT (rdv_id) DO NOTHING;
END LOOP;
END $$;
-- Step 5: create ordonnances + lines
DO $$
DECLARE c RECORD;
BEGIN FOR c IN
SELECT id,
  medecin_id,
  patient_id
FROM consultations
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
    notes_medecin,
    created_at,
    updated_at
  )
VALUES (
    c.id,
    c.medecin_id,
    c.patient_id,
    CURRENT_DATE,
    CURRENT_DATE + 30,
    'QR' || LEFT(md5(c.id::text), 10),
    'https://qr/' || LEFT(md5(c.id::text), 10),
    'https://pdf/' || LEFT(md5(c.id::text), 10),
    'Prescription',
    NOW(),
    NOW()
  );
END LOOP;
END $$;
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
    quantite,
    created_at
  )
SELECT o.id,
  1,
  'Paracetamol',
  'Paracetamol',
  'Antalgique',
  '500mg',
  'comprimes',
  '1 matin',
  2,
  7,
  14,
  NOW()
FROM ordonnances o
LIMIT 250;
-- Step 6: verify counts
SELECT 'users' AS etape,
  COUNT(*) AS n
FROM users;
SELECT 'patients' AS etape,
  COUNT(*) AS n
FROM patients;
SELECT 'medecins' AS etape,
  COUNT(*) AS n
FROM medecins;
SELECT 'structures' AS etape,
  COUNT(*) AS n
FROM structures;
SELECT 'rdv' AS etape,
  COUNT(*) AS n
FROM rendez_vous;
SELECT 'paiements' AS etape,
  COUNT(*) AS n
FROM paiements;
SELECT 'consultations' AS etape,
  COUNT(*) AS n
FROM consultations;
SELECT 'ordonnances' AS etape,
  COUNT(*) AS n
FROM ordonnances;
SELECT 'ord_lignes' AS etape,
  COUNT(*) AS n
FROM ordonnance_lignes;
