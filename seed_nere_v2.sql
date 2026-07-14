-- =====================================================================
-- SCRIPT DE SEED v2 - PROJET NÉRÉ - PostgreSQL
-- Peuple les 23 tables avec des données cohérentes et liées par FK.
-- Mot de passe pour TOUS les comptes utilisateurs : MotDePasse123!
-- Hash (bcrypt) : $2b$12$tz9I/luUZBTrky8sz0wDGuu.UyzSKDXY30uykH5/9xmw7PXkSRywS
-- Prérequis : CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- =====================================================================

SET search_path TO public;

-- ---------------------------------------------------------------------
-- 06 - SPECIALITES (référentiel, indépendant)
-- ---------------------------------------------------------------------
INSERT INTO specialites (id, code, libelle_fr, libelle_en, description, actif, ordre_affichage) VALUES
('2230a402-ccde-4b4c-8845-5c7fe2c857c5', 'MED_GEN', 'Médecine Générale', 'General Medicine', 'Consultation médicale générale pour tous les âges.', true, 1),
('fee92394-b5d4-45a1-bb94-dcdb17201b4f', 'CARDIO', 'Cardiologie', 'Cardiology', 'Diagnostic et traitement des maladies du cœur.', true, 2),
('5c5a9d54-533f-43c9-a283-9f49cf08e585', 'PEDIATRIE', 'Pédiatrie', 'Pediatrics', 'Suivi médical des enfants de 0 à 18 ans.', true, 3),
('156fd661-ab2b-45cf-809e-8baeb9b44cf3', 'GYNECO', 'Gynécologie', 'Gynecology', 'Santé reproductive et suivi gynécologique.', true, 4)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 04 - STRUCTURES (extension de users)
-- ---------------------------------------------------------------------
INSERT INTO users (id, email, telephone, mot_de_passe_hash, role, statut, nom, prenom, email_verifie, totp_actif) VALUES
('49d0afb3-89bd-43f0-a948-007f19aeda18', 'contact@douala-general-seed.cm', '+237699000091', '$2b$12$tz9I/luUZBTrky8sz0wDGuu.UyzSKDXY30uykH5/9xmw7PXkSRywS', 'structure', 'actif', 'Douala General Hospital', 'Administration', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO structures (id, nom_etablissement, type, statut_verification, numero_autorisation, numero_contribuable, date_creation, adresse, ville, region, pays, telephone_pro, email_pro, services_offerts, capacite_lits) VALUES
('49d0afb3-89bd-43f0-a948-007f19aeda18', 'Douala General Hospital', 'hopital', 'verifie', 'MINSANTE-2020-00451', 'M091912345678', '2010-03-15', 'Boulevard de la Liberté, Akwa', 'Douala', 'Littoral', 'CM', '+237699000091', 'contact@douala-general-seed.cm', ARRAY['urgences','radiologie','maternite','laboratoire'], 250)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 01/02 - USERS + PATIENTS
-- ---------------------------------------------------------------------
INSERT INTO users (id, email, telephone, mot_de_passe_hash, role, statut, nom, prenom, email_verifie, totp_actif) VALUES
('c526d9fc-50de-4d36-9411-6226ca61c598', 'seed.patient1@nere-health.cm', '+237677999001', '$2b$12$tz9I/luUZBTrky8sz0wDGuu.UyzSKDXY30uykH5/9xmw7PXkSRywS', 'patient', 'actif', 'Ewolo', 'Sabine', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, numero_patient, date_naissance, sexe, groupe_sanguin, ville, region, pays, taille_cm, poids_kg, allergies, antecedents_medicaux, couverture_assurance, contact_urgence_nom, contact_urgence_tel, consentement_donnees, date_consentement) VALUES
('c526d9fc-50de-4d36-9411-6226ca61c598', 'NER-2026-900001', '1995-04-12', 'F', 'O+', 'Douala', 'Makepe', 'CM', 165.00, 60.50, ARRAY['pénicilline'], 'Aucun antécédent notable.', 'CNPS', 'Jean Ewolo', '+237677000002', true, now())
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 01/03 - USERS + MEDECINS
-- ---------------------------------------------------------------------
INSERT INTO users (id, email, telephone, mot_de_passe_hash, role, statut, nom, prenom, email_verifie, totp_actif) VALUES
('0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'seed.medecin1@nere-health.cm', '+237699998001', '$2b$12$tz9I/luUZBTrky8sz0wDGuu.UyzSKDXY30uykH5/9xmw7PXkSRywS', 'medecin', 'actif', 'Ebelle', 'Ashley', true, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO medecins (id, numero_ordre, statut_verification, annees_experience, biographie, langues_parlees, tarif_consultation, devise, teleconsultation_active, structure_id, disponible_maintenant) VALUES
('0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'SEED-No3456TbErvy', 'verifie', 7, 'Médecin généraliste expérimentée, passionnée par la médecine de famille.', ARRAY['Français','Anglais'], 5000.00, 'XAF', true, '49d0afb3-89bd-43f0-a948-007f19aeda18', true)
ON CONFLICT (id) DO NOTHING;

-- liaison médecin <-> spécialité (N:M)
INSERT INTO medecin_specialites (medecin_id, specialite_id, principale, annees_pratique, certifie) VALUES
('0cb0cb79-c13d-4734-a267-a6a19b3e320a', '2230a402-ccde-4b4c-8845-5c7fe2c857c5', true, 7, true)
ON CONFLICT (medecin_id, specialite_id) DO NOTHING;

-- NOTE : la table structure_medecins n'existe pas dans cette base
-- (non créée par les migrations Alembic). Le lien médecin <-> structure
-- se fait uniquement via medecins.structure_id (déjà renseigné ci-dessus).


-- ---------------------------------------------------------------------
-- 08 - DISPONIBILITES (créneaux du médecin)
-- ---------------------------------------------------------------------
INSERT INTO disponibilites (id, medecin_id, jour_semaine, heure_debut, heure_fin, duree_creneau_minutes, type, recurrence, actif) VALUES
('6e86ccd1-33f6-4250-97ec-c0af181a5330', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'lundi', '09:00', '12:00', 30, 'video', 'hebdomadaire', true),
('bef402d6-aa1d-4a88-8d6d-6dcaeb26f54a', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'mercredi', '14:00', '17:00', 30, 'presentiel', 'hebdomadaire', true)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 11 - DOSSIERS_MEDICAUX (1:1 avec patients)
-- Si un trigger AFTER INSERT ON patients a déjà créé une ligne pour ce
-- patient_id, cet INSERT échouera sur la contrainte UNIQUE(patient_id).
-- Dans ce cas, utilise plutôt l'UPDATE en commentaire plus bas.
-- ---------------------------------------------------------------------
INSERT INTO dossiers_medicaux (id, numero_dossier, patient_id, medecin_traitant_id, antecedents_familiaux, antecedents_personnels, antecedents_chirurgicaux, antecedents_allergiques, habitudes_vie, taille_cm, poids_kg, tension_arterielle, vaccinations, traitements_chroniques) VALUES
('a33ae9e9-6104-4a39-9dfa-24a73fc9e93c', 'DME-2026-900001', 'c526d9fc-50de-4d36-9411-6226ca61c598', '0cb0cb79-c13d-4734-a267-a6a19b3e320a',
 'Hypertension chez le père.', 'Aucun antécédent personnel majeur.', 'Appendicectomie en 2015.', 'Allergie à la pénicilline.',
 '{"tabac":{"actif":false},"alcool":{"consommation":"occasionnel"}}'::jsonb,
 165.00, 60.50, '120/80',
 '[{"vaccin":"COVID-19","date":"2021-06-01","prochain_rappel":"2023"}]'::jsonb,
 '[]'::jsonb
)
ON CONFLICT (patient_id) DO UPDATE SET
  medecin_traitant_id = EXCLUDED.medecin_traitant_id,
  antecedents_familiaux = EXCLUDED.antecedents_familiaux,
  antecedents_personnels = EXCLUDED.antecedents_personnels,
  antecedents_chirurgicaux = EXCLUDED.antecedents_chirurgicaux,
  antecedents_allergiques = EXCLUDED.antecedents_allergiques,
  habitudes_vie = EXCLUDED.habitudes_vie,
  taille_cm = EXCLUDED.taille_cm,
  poids_kg = EXCLUDED.poids_kg,
  tension_arterielle = EXCLUDED.tension_arterielle,
  vaccinations = EXCLUDED.vaccinations,
  traitements_chroniques = EXCLUDED.traitements_chroniques;


-- ---------------------------------------------------------------------
-- 09 - RENDEZ_VOUS
-- ---------------------------------------------------------------------
INSERT INTO rendez_vous (id, numero_rdv, patient_id, medecin_id, structure_id, date_heure_debut, date_heure_fin, type, statut, motif_consultation, montant, devise) VALUES
('35f608e8-9f01-4995-aec2-24cade67f085', 'NER-RDV-2026-900001', 'c526d9fc-50de-4d36-9411-6226ca61c598', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', '49d0afb3-89bd-43f0-a948-007f19aeda18',
 '2026-06-20 09:00:00+00', '2026-06-20 09:30:00+00', 'video', 'confirme', 'Consultation de suivi - fatigue persistante.', 5000.00, 'XAF')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 12 - CONSULTATIONS (1:1 avec rendez_vous)
-- ---------------------------------------------------------------------
INSERT INTO consultations (id, numero_consultation, rdv_id, dossier_id, medecin_id, patient_id, date_heure_debut, date_heure_fin, motif, anamnese, examen_clinique, diagnostic_principal, code_cim10, plan_traitement, resume_ia, statut) VALUES
('f5450066-2266-4f39-8237-e8ee4a0b91ac', 'CONS-2026-900001', '35f608e8-9f01-4995-aec2-24cade67f085', 'a33ae9e9-6104-4a39-9dfa-24a73fc9e93c', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 '2026-06-20 09:00:00+00', '2026-06-20 09:25:00+00', 'Fatigue persistante depuis 2 semaines.',
 'Patiente rapporte fatigue, sommeil perturbé, pas de fièvre.',
 'Tension artérielle normale, auscultation cardiaque RAS.',
 'Asthénie fonctionnelle', 'R53',
 'Repos, supplémentation en fer, contrôle bilan sanguin dans 1 mois.',
 'Consultation de suivi pour fatigue. Examen clinique normal. Bilan sanguin recommandé.',
 'terminee'
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 13/14 - ORDONNANCES + ORDONNANCE_LIGNES
-- ---------------------------------------------------------------------
INSERT INTO ordonnances (id, numero, consultation_id, medecin_id, patient_id, date_emission, date_expiration, statut, code_pharmacie, qr_code_data, renouvelable, nb_renouvellements_max, nb_renouvellements) VALUES
('b6680704-bfa4-4753-9f60-0adeb14e2237', 'ORD-2026-900001', 'f5450066-2266-4f39-8237-e8ee4a0b91ac', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 '2026-06-20', '2026-09-20', 'active', 'PH9SEED1', 'NER-ORD-2026-900001-QR', false, 0, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ordonnance_lignes (id, ordonnance_id, ordre, medicament_nom, dci, dosage, forme, posologie, frequence_par_jour, duree_jours, quantite, avant_repas) VALUES
('bd76bdf6-584c-48df-a943-83d1e339e8f4', 'b6680704-bfa4-4753-9f60-0adeb14e2237', 1, 'Tardyferon 80mg', 'Fer (sulfate ferreux)', '80 mg', 'comprimes', '1 comprimé par jour pendant 30 jours', 1, 30, 30, false)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 10 - PAIEMENTS (1:1 avec rendez_vous)
-- ---------------------------------------------------------------------
INSERT INTO paiements (id, reference, rdv_id, patient_id, medecin_id, montant_total, devise, frais_plateforme, taux_commission, methode, fournisseur, statut, reference_fournisseur) VALUES
('c1fd4320-c78f-4a3d-b079-85c1b0ae6fdf', 'NER-PAY-2026-900001', '35f608e8-9f01-4995-aec2-24cade67f085', 'c526d9fc-50de-4d36-9411-6226ca61c598', '0cb0cb79-c13d-4734-a267-a6a19b3e320a',
 5000.00, 'XAF', 500.00, 0.1000, 'mtn_momo', 'cinetpay', 'confirme', 'CINETPAY-TXN-900123')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 15 - DOCUMENTS_MEDICAUX
-- ---------------------------------------------------------------------
INSERT INTO documents_medicaux (id, patient_id, consultation_id, uploaded_par, type_document, nom_fichier_original, nom_fichier_stockage, url_stockage, checksum_sha256, taille_octets, mime_type, est_chiffre, visible_patient, description, date_document) VALUES
('a1a2dccf-4c82-4f9f-9240-77e40f117460', 'c526d9fc-50de-4d36-9411-6226ca61c598', 'f5450066-2266-4f39-8237-e8ee4a0b91ac', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 'resultat_labo', 'bilan_sanguin_juin2026.pdf', 'docs/2026/06/bilan_sanguin_juin2026_enc.pdf', 'https://storage.nere-health.cm/docs/2026/06/bilan_sanguin_juin2026_enc.pdf',
 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 245870, 'application/pdf', true, true, 'Résultats du bilan sanguin de contrôle.', '2026-06-21')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 16/17 - CONVERSATIONS + MESSAGES
-- ---------------------------------------------------------------------
INSERT INTO conversations (id, patient_id, medecin_id, rdv_id, statut, nb_messages_non_lus_patient, nb_messages_non_lus_medecin, dernier_message_at, dernier_message_preview) VALUES
('16166669-5ce2-448c-b548-13110d050115', 'c526d9fc-50de-4d36-9411-6226ca61c598', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', '35f608e8-9f01-4995-aec2-24cade67f085',
 'active', 0, 1, '2026-06-19 18:30:00+00', 'Bonjour Docteur, je voulais...')
ON CONFLICT (id) DO NOTHING;

-- contenu_chiffre via pgp_sym_encrypt (pgcrypto requis)
INSERT INTO messages (id, conversation_id, expediteur_id, contenu_chiffre, type, lu_par_destinataire) VALUES
('80630bbd-43ee-4dd1-a13b-8af3977f3321', '16166669-5ce2-448c-b548-13110d050115', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 pgp_sym_encrypt('Bonjour Docteur, je voulais savoir si je dois continuer le traitement.', 'cle_demo_nere'), 'texte', false)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 18 - CHATBOT_SESSIONS
-- ---------------------------------------------------------------------
INSERT INTO chatbot_sessions (id, patient_id, messages, symptomes_detectes, specialite_suggeree, niveau_urgence, modele_ia, tokens_utilises, cout_estime_usd, statut) VALUES
('fa290c60-f4be-49da-b316-f91b881cb1f7', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 '[{"role":"user","content":"J''ai des maux de tête fréquents"},{"role":"assistant","content":"Depuis combien de temps avez-vous ces maux de tête ?"}]'::jsonb,
 ARRAY['maux de tête','fatigue'], 'Médecine Générale', 'faible', 'gpt-4o-mini', 320, 0.000480, 'active')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 19 - AVIS (1:1 avec rendez_vous)
-- ---------------------------------------------------------------------
INSERT INTO avis (id, patient_id, medecin_id, rdv_id, note, commentaire, verifie, masque, reponse_medecin) VALUES
('1cbccee1-ba3e-4556-8bc0-381765f3879d', 'c526d9fc-50de-4d36-9411-6226ca61c598', '0cb0cb79-c13d-4734-a267-a6a19b3e320a', '35f608e8-9f01-4995-aec2-24cade67f085',
 5, 'Médecin très à l''écoute, consultation rapide et efficace.', true, false, 'Merci beaucoup pour votre confiance !')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 20 - NOTIFICATIONS
-- ---------------------------------------------------------------------
INSERT INTO notifications (id, utilisateur_id, type, canal, statut, titre, contenu, donnees_supplementaires, date_envoi_planifie, date_envoi_reel) VALUES
('dccc2c32-74f3-4320-8886-b3ce2e0b9666', 'c526d9fc-50de-4d36-9411-6226ca61c598', 'rappel_rdv', 'push', 'envoye', 'Rappel de RDV',
 'Vous avez un rendez-vous demain à 09:00 avec Dr. Ebelle.',
 '{"rdv_id":"35f608e8-9f01-4995-aec2-24cade67f085","medecin_nom":"Dr. Ebelle"}'::jsonb,
 '2026-06-19 09:00:00+00', '2026-06-19 09:00:00+00')
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------
-- 21 - SESSIONS (JWT)
-- ---------------------------------------------------------------------
INSERT INTO sessions (id, utilisateur_id, refresh_token_hash, ip_address, appareil, plateforme, expires_at, revoque) VALUES
('ece1c458-f94e-41c0-9372-a5c52671e136', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 'b1d5781111d84f7b3fe45a0852e59758cd7a87e5376d7144d1e7e0eb3aae2127', '102.91.20.45', 'Samsung Galaxy S23 / Android 14', 'android',
 now() + interval '7 days', false)
ON CONFLICT (id) DO NOTHING;


-- NOTE : la table observateurs n'existe pas dans cette base
-- (non créée par les migrations Alembic). Bloc retiré pour ce seed.


-- ---------------------------------------------------------------------
-- 22 - AUDIT_LOGS (BIGSERIAL, pas d'UUID pour id)
-- ---------------------------------------------------------------------
INSERT INTO audit_logs (utilisateur_id, role_utilisateur, session_id, action, entite_type, entite_id, ip_address, donnees_avant, donnees_apres, succes, code_http) VALUES
('c526d9fc-50de-4d36-9411-6226ca61c598', 'patient', 'ece1c458-f94e-41c0-9372-a5c52671e136', 'connexion', 'users', 'c526d9fc-50de-4d36-9411-6226ca61c598',
 '102.91.20.45', NULL, '{"statut":"connexion_reussie"}'::jsonb, true, 200);


-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================
