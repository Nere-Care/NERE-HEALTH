cat << 'EOF' > /home/claude/seed.py
"""
Seed script - NERE Health
Equivalent Python du seed_nere_v2.sql
Usage: docker compose exec backend python scripts/seed.py
"""

import sys
import uuid
from datetime import datetime, date, timezone

from sqlalchemy.orm import Session
from db import SessionLocal
from models import (
    User, Patient, Medecin, Structure,
    Specialite, MedecinSpecialite, Disponibilite,
    DossierMedical, RendezVous, Consultation,
    Ordonnance, OrdonnanceLigne, Paiement,
    DocumentMedical, Conversation, Message,
    ChatbotSession, Avis, Notification, Session as SessionModel,
    AuditLog,
)
from bcrypt import hashpw, gensalt
from sqlalchemy import text


PASSWORD_HASH = hashpw(b"MotDePasse123!", gensalt()).decode("utf-8")

# UUIDs fixes (identiques au seed SQL v2)
ID_STRUCTURE   = uuid.UUID("49d0afb3-89bd-43f0-a948-007f19aeda18")
ID_PATIENT     = uuid.UUID("c526d9fc-50de-4d36-9411-6226ca61c598")
ID_MEDECIN     = uuid.UUID("0cb0cb79-c13d-4734-a267-a6a19b3e320a")
ID_SPEC_MGEN   = uuid.UUID("2230a402-ccde-4b4c-8845-5c7fe2c857c5")
ID_SPEC_CARDIO = uuid.UUID("fee92394-b5d4-45a1-bb94-dcdb17201b4f")
ID_SPEC_PEDIA  = uuid.UUID("5c5a9d54-533f-43c9-a283-9f49cf08e585")
ID_SPEC_GYNECO = uuid.UUID("156fd661-ab2b-45cf-809e-8baeb9b44cf3")
ID_DISPO_1     = uuid.UUID("6e86ccd1-33f6-4250-97ec-c0af181a5330")
ID_DISPO_2     = uuid.UUID("bef402d6-aa1d-4a88-8d6d-6dcaeb26f54a")
ID_DOSSIER     = uuid.UUID("a33ae9e9-6104-4a39-9dfa-24a73fc9e93c")
ID_RDV         = uuid.UUID("35f608e8-9f01-4995-aec2-24cade67f085")
ID_CONSULT     = uuid.UUID("f5450066-2266-4f39-8237-e8ee4a0b91ac")
ID_ORDO        = uuid.UUID("b6680704-bfa4-4753-9f60-0adeb14e2237")
ID_ORDO_LIGNE  = uuid.UUID("bd76bdf6-584c-48df-a943-83d1e339e8f4")
ID_PAIEMENT    = uuid.UUID("c1fd4320-c78f-4a3d-b079-85c1b0ae6fdf")
ID_DOC         = uuid.UUID("a1a2dccf-4c82-4f9f-9240-77e40f117460")
ID_CONV        = uuid.UUID("16166669-5ce2-448c-b548-13110d050115")
ID_MSG         = uuid.UUID("80630bbd-43ee-4dd1-a13b-8af3977f3321")
ID_CHATBOT     = uuid.UUID("fa290c60-f4be-49da-b316-f91b881cb1f7")
ID_AVIS        = uuid.UUID("1cbccee1-ba3e-4556-8bc0-381765f3879d")
ID_NOTIF       = uuid.UUID("dccc2c32-74f3-4320-8886-b3ce2e0b9666")
ID_SESSION_JWT = uuid.UUID("ece1c458-f94e-41c0-9372-a5c52671e136")

NOW = datetime.now(timezone.utc)


def skip_if_exists(db, model, pk_value, label):
    obj = db.get(model, pk_value)
    if obj:
        print(f"  [SKIP] {label} existe deja")
        return True
    return False


def run():
    db: Session = SessionLocal()
    try:
        print("=== SEED NERE HEALTH v2 ===")

        # ------------------------------------------------------------------
        # 1. SPECIALITES
        # ------------------------------------------------------------------
        print("\n[1] Specialites...")
        specs = [
            dict(id=ID_SPEC_MGEN,   code="MED_GEN",  libelle_fr="Medecine Generale",   libelle_en="General Medicine",  actif=True, ordre_affichage=1),
            dict(id=ID_SPEC_CARDIO, code="CARDIO",    libelle_fr="Cardiologie",          libelle_en="Cardiology",        actif=True, ordre_affichage=2),
            dict(id=ID_SPEC_PEDIA,  code="PEDIATRIE", libelle_fr="Pediatrie",            libelle_en="Pediatrics",        actif=True, ordre_affichage=3),
            dict(id=ID_SPEC_GYNECO, code="GYNECO",    libelle_fr="Gynecologie",          libelle_en="Gynecology",        actif=True, ordre_affichage=4),
        ]
        for s in specs:
            if not db.get(Specialite, s["id"]):
                db.add(Specialite(**s))
                print(f"  [OK] Specialite {s['libelle_fr']}")
        db.flush()

        # ------------------------------------------------------------------
        # 2. STRUCTURE (user + structure)
        # ------------------------------------------------------------------
        print("\n[2] Structure...")
        if not db.get(User, ID_STRUCTURE):
            db.add(User(
                id=ID_STRUCTURE,
                email="contact@douala-general-seed.cm",
                telephone="+237699000091",
                mot_de_passe_hash=PASSWORD_HASH,
                role="structure",
                statut="actif",
                nom="Douala General Hospital",
                prenom="Administration",
                email_verifie=True,
                totp_actif=False,
            ))
            db.flush()
            db.add(Structure(
                id=ID_STRUCTURE,
                nom_etablissement="Douala General Hospital",
                type="hopital",
                statut_verification="verifie",
                numero_autorisation="MINSANTE-2020-00451",
                adresse="Boulevard de la Liberte, Akwa",
                ville="Douala",
                region="Littoral",
                pays="CM",
                telephone_pro="+237699000091",
                email_pro="contact@douala-general-seed.cm",
                services_offerts=["urgences", "radiologie", "maternite", "laboratoire"],
                capacite_lits=250,
            ))
            print("  [OK] Structure Douala General Hospital")
        else:
            print("  [SKIP] Structure existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 3. PATIENT
        # ------------------------------------------------------------------
        print("\n[3] Patient...")
        if not db.get(User, ID_PATIENT):
            db.add(User(
                id=ID_PATIENT,
                email="seed.patient1@nere-health.cm",
                telephone="+237677999001",
                mot_de_passe_hash=PASSWORD_HASH,
                role="patient",
                statut="actif",
                nom="Ewolo",
                prenom="Sabine",
                email_verifie=True,
                totp_actif=False,
            ))
            db.flush()
            db.add(Patient(
                id=ID_PATIENT,
                numero_patient="NER-2026-900001",
                date_naissance=date(1995, 4, 12),
                sexe="F",
                groupe_sanguin="O+",
                ville="Douala",
                region="Makepe",
                pays="CM",
                taille_cm=165.00,
                poids_kg=60.50,
                allergies=["penicilline"],
                antecedents_medicaux="Aucun antecedent notable.",
                couverture_assurance="CNPS",
                contact_urgence_nom="Jean Ewolo",
                contact_urgence_tel="+237677000002",
                consentement_donnees=True,
                date_consentement=NOW,
            ))
            print("  [OK] Patient Sabine Ewolo")
        else:
            print("  [SKIP] Patient existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 4. MEDECIN
        # ------------------------------------------------------------------
        print("\n[4] Medecin...")
        if not db.get(User, ID_MEDECIN):
            db.add(User(
                id=ID_MEDECIN,
                email="seed.medecin1@nere-health.cm",
                telephone="+237699998001",
                mot_de_passe_hash=PASSWORD_HASH,
                role="medecin",
                statut="actif",
                nom="Ebelle",
                prenom="Ashley",
                email_verifie=True,
                totp_actif=False,
            ))
            db.flush()
            db.add(Medecin(
                id=ID_MEDECIN,
                numero_ordre="SEED-No3456TbErvy",
                statut_verification="verifie",
                annees_experience=7,
                biographie="Medecin generaliste experimentee, passionnee par la medecine de famille.",
                langues_parlees=["Francais", "Anglais"],
                tarif_consultation=5000.00,
                devise="XAF",
                teleconsultation_active=True,
                structure_id=ID_STRUCTURE,
                disponible_maintenant=True,
            ))
            print("  [OK] Medecin Ashley Ebelle")
        else:
            print("  [SKIP] Medecin existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 5. MEDECIN_SPECIALITES
        # ------------------------------------------------------------------
        print("\n[5] Medecin specialites...")
        existing_ms = db.query(MedecinSpecialite).filter_by(
            medecin_id=ID_MEDECIN, specialite_id=ID_SPEC_MGEN
        ).first()
        if not existing_ms:
            db.add(MedecinSpecialite(
                medecin_id=ID_MEDECIN,
                specialite_id=ID_SPEC_MGEN,
                principale=True,
                annees_pratique=7,
                certifie=True,
            ))
            print("  [OK] Liaison medecin-specialite")
        else:
            print("  [SKIP] Liaison existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 6. DISPONIBILITES
        # ------------------------------------------------------------------
        print("\n[6] Disponibilites...")
        for dispo_id, jour, hdebut, hfin, dtype in [
            (ID_DISPO_1, "lundi",    "09:00", "12:00", "video"),
            (ID_DISPO_2, "mercredi", "14:00", "17:00", "presentiel"),
        ]:
            if not db.get(Disponibilite, dispo_id):
                db.add(Disponibilite(
                    id=dispo_id,
                    medecin_id=ID_MEDECIN,
                    jour_semaine=jour,
                    heure_debut=hdebut,
                    heure_fin=hfin,
                    duree_creneau_minutes=30,
                    type=dtype,
                    recurrence="hebdomadaire",
                    actif=True,
                ))
                print(f"  [OK] Disponibilite {jour} {hdebut}-{hfin}")
        db.flush()

        # ------------------------------------------------------------------
        # 7. DOSSIER MEDICAL
        # ------------------------------------------------------------------
        print("\n[7] Dossier medical...")
        existing_dm = db.query(DossierMedical).filter_by(patient_id=ID_PATIENT).first()
        if not existing_dm:
            db.add(DossierMedical(
                id=ID_DOSSIER,
                numero_dossier="DME-2026-900001",
                patient_id=ID_PATIENT,
                medecin_traitant_id=ID_MEDECIN,
                antecedents_familiaux="Hypertension chez le pere.",
                antecedents_personnels="Aucun antecedent personnel majeur.",
                antecedents_chirurgicaux="Appendicectomie en 2015.",
                antecedents_allergiques="Allergie a la penicilline.",
                habitudes_vie={"tabac": {"actif": False}, "alcool": {"consommation": "occasionnel"}},
                taille_cm=165.00,
                poids_kg=60.50,
                tension_arterielle="120/80",
                vaccinations=[{"vaccin": "COVID-19", "date": "2021-06-01", "prochain_rappel": "2023"}],
                traitements_chroniques=[],
            ))
            print("  [OK] Dossier medical")
        else:
            # Mettre a jour si le medecin traitant manque
            if not existing_dm.medecin_traitant_id:
                existing_dm.medecin_traitant_id = ID_MEDECIN
            print("  [UPDATE] Dossier medical mis a jour")
        db.flush()

        # ------------------------------------------------------------------
        # 8. RENDEZ-VOUS
        # ------------------------------------------------------------------
        print("\n[8] Rendez-vous...")
        if not db.get(RendezVous, ID_RDV):
            db.add(RendezVous(
                id=ID_RDV,
                numero_rdv="NER-RDV-2026-900001",
                patient_id=ID_PATIENT,
                medecin_id=ID_MEDECIN,
                structure_id=ID_STRUCTURE,
                date_heure_debut=datetime(2026, 6, 20, 9, 0, 0, tzinfo=timezone.utc),
                date_heure_fin=datetime(2026, 6, 20, 9, 30, 0, tzinfo=timezone.utc),
                type="video",
                statut="confirme",
                motif_consultation="Consultation de suivi - fatigue persistante.",
                montant=5000.00,
                devise="XAF",
            ))
            print("  [OK] Rendez-vous")
        else:
            print("  [SKIP] Rendez-vous existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 9. CONSULTATION
        # ------------------------------------------------------------------
        print("\n[9] Consultation...")
        if not db.get(Consultation, ID_CONSULT):
            db.add(Consultation(
                id=ID_CONSULT,
                numero_consultation="CONS-2026-900001",
                rdv_id=ID_RDV,
                dossier_id=ID_DOSSIER,
                medecin_id=ID_MEDECIN,
                patient_id=ID_PATIENT,
                date_heure_debut=datetime(2026, 6, 20, 9, 0, 0, tzinfo=timezone.utc),
                date_heure_fin=datetime(2026, 6, 20, 9, 25, 0, tzinfo=timezone.utc),
                motif="Fatigue persistante depuis 2 semaines.",
                anamnese="Patiente rapporte fatigue, sommeil perturbe, pas de fievre.",
                examen_clinique="Tension arterielle normale, auscultation cardiaque RAS.",
                diagnostic_principal="Asthenie fonctionnelle",
                code_cim10="R53",
                plan_traitement="Repos, supplementation en fer, controle bilan sanguin dans 1 mois.",
                resume_ia="Consultation de suivi pour fatigue. Examen clinique normal. Bilan sanguin recommande.",
                statut="terminee",
            ))
            print("  [OK] Consultation")
        else:
            print("  [SKIP] Consultation existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 10. ORDONNANCE + LIGNE
        # ------------------------------------------------------------------
        print("\n[10] Ordonnance...")
        if not db.get(Ordonnance, ID_ORDO):
            db.add(Ordonnance(
                id=ID_ORDO,
                numero="ORD-2026-900001",
                consultation_id=ID_CONSULT,
                medecin_id=ID_MEDECIN,
                patient_id=ID_PATIENT,
                date_emission=date(2026, 6, 20),
                date_expiration=date(2026, 9, 20),
                statut="active",
                code_pharmacie="PH9SEED1",
                qr_code_data="NER-ORD-2026-900001-QR",
                renouvelable=False,
                nb_renouvellements_max=0,
                nb_renouvellements=0,
            ))
            db.flush()
            db.add(OrdonnanceLigne(
                id=ID_ORDO_LIGNE,
                ordonnance_id=ID_ORDO,
                ordre=1,
                medicament_nom="Tardyferon 80mg",
                dci="Fer (sulfate ferreux)",
                dosage="80 mg",
                forme="comprimes",
                posologie="1 comprime par jour pendant 30 jours",
                frequence_par_jour=1,
                duree_jours=30,
                quantite=30,
                avant_repas=False,
            ))
            print("  [OK] Ordonnance + ligne")
        else:
            print("  [SKIP] Ordonnance existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 11. PAIEMENT
        # ------------------------------------------------------------------
        print("\n[11] Paiement...")
        if not db.get(Paiement, ID_PAIEMENT):
            db.add(Paiement(
                id=ID_PAIEMENT,
                reference="NER-PAY-2026-900001",
                rdv_id=ID_RDV,
                patient_id=ID_PATIENT,
                medecin_id=ID_MEDECIN,
                montant_total=5000.00,
                devise="XAF",
                frais_plateforme=500.00,
                taux_commission=0.1000,
                methode="mtn_momo",
                fournisseur="cinetpay",
                statut="confirme",
                reference_fournisseur="CINETPAY-TXN-900123",
            ))
            print("  [OK] Paiement")
        else:
            print("  [SKIP] Paiement existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 12. DOCUMENT MEDICAL
        # ------------------------------------------------------------------
        print("\n[12] Document medical...")
        if not db.get(DocumentMedical, ID_DOC):
            db.add(DocumentMedical(
                id=ID_DOC,
                patient_id=ID_PATIENT,
                consultation_id=ID_CONSULT,
                uploaded_par=ID_PATIENT,
                type_document="resultat_labo",
                nom_fichier_original="bilan_sanguin_juin2026.pdf",
                nom_fichier_stockage="docs/2026/06/bilan_sanguin_juin2026_enc.pdf",
                url_stockage="https://storage.nere-health.cm/docs/2026/06/bilan_sanguin_juin2026_enc.pdf",
                checksum_sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                taille_octets=245870,
                mime_type="application/pdf",
                est_chiffre=True,
                visible_patient=True,
                description="Resultats du bilan sanguin de controle.",
                date_document=date(2026, 6, 21),
            ))
            print("  [OK] Document medical")
        else:
            print("  [SKIP] Document existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 13. CONVERSATION + MESSAGE
        # ------------------------------------------------------------------
        print("\n[13] Conversation + message...")
        if not db.get(Conversation, ID_CONV):
            db.add(Conversation(
                id=ID_CONV,
                patient_id=ID_PATIENT,
                medecin_id=ID_MEDECIN,
                rdv_id=ID_RDV,
                statut="active",
                nb_messages_non_lus_patient=0,
                nb_messages_non_lus_medecin=1,
                dernier_message_at=datetime(2026, 6, 19, 18, 30, 0, tzinfo=timezone.utc),
                dernier_message_preview="Bonjour Docteur, je voulais...",
            ))
            db.flush()

            # Message chiffre via pgcrypto
            if not db.get(Message, ID_MSG):
                row = db.execute(
                    text("SELECT pgp_sym_encrypt(:txt, 'cle_demo_nere') AS chiffre"),
                    {"txt": "Bonjour Docteur, je voulais savoir si je dois continuer le traitement."}
                ).fetchone()
                db.add(Message(
                    id=ID_MSG,
                    conversation_id=ID_CONV,
                    expediteur_id=ID_PATIENT,
                    contenu_chiffre=row.chiffre,
                    type="texte",
                    lu_par_destinataire=False,
                ))
            print("  [OK] Conversation + message")
        else:
            print("  [SKIP] Conversation existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 14. CHATBOT SESSION
        # ------------------------------------------------------------------
        print("\n[14] Chatbot session...")
        if not db.get(ChatbotSession, ID_CHATBOT):
            db.add(ChatbotSession(
                id=ID_CHATBOT,
                patient_id=ID_PATIENT,
                messages=[
                    {"role": "user", "content": "J'ai des maux de tete frequents"},
                    {"role": "assistant", "content": "Depuis combien de temps avez-vous ces maux de tete ?"},
                ],
                symptomes_detectes=["maux de tete", "fatigue"],
                specialite_suggeree="Medecine Generale",
                niveau_urgence="faible",
                modele_ia="gpt-4o-mini",
                tokens_utilises=320,
                cout_estime_usd=0.000480,
                statut="active",
            ))
            print("  [OK] Chatbot session")
        else:
            print("  [SKIP] Chatbot session existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 15. AVIS
        # ------------------------------------------------------------------
        print("\n[15] Avis...")
        if not db.get(Avis, ID_AVIS):
            db.add(Avis(
                id=ID_AVIS,
                patient_id=ID_PATIENT,
                medecin_id=ID_MEDECIN,
                rdv_id=ID_RDV,
                note=5,
                commentaire="Medecin tres a l'ecoute, consultation rapide et efficace.",
                verifie=True,
                masque=False,
                reponse_medecin="Merci beaucoup pour votre confiance !",
            ))
            print("  [OK] Avis")
        else:
            print("  [SKIP] Avis existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 16. NOTIFICATION
        # ------------------------------------------------------------------
        print("\n[16] Notification...")
        if not db.get(Notification, ID_NOTIF):
            db.add(Notification(
                id=ID_NOTIF,
                utilisateur_id=ID_PATIENT,
                type="rappel_rdv",
                canal="push",
                statut="envoye",
                titre="Rappel de RDV",
                contenu="Vous avez un rendez-vous demain a 09:00 avec Dr. Ebelle.",
                donnees_supplementaires={
                    "rdv_id": str(ID_RDV),
                    "medecin_nom": "Dr. Ebelle",
                },
                date_envoi_planifie=datetime(2026, 6, 19, 9, 0, 0, tzinfo=timezone.utc),
                date_envoi_reel=datetime(2026, 6, 19, 9, 0, 0, tzinfo=timezone.utc),
            ))
            print("  [OK] Notification")
        else:
            print("  [SKIP] Notification existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 17. SESSION JWT
        # ------------------------------------------------------------------
        print("\n[17] Session JWT...")
        if not db.get(SessionModel, ID_SESSION_JWT):
            db.add(SessionModel(
                id=ID_SESSION_JWT,
                utilisateur_id=ID_PATIENT,
                refresh_token_hash="b1d5781111d84f7b3fe45a0852e59758cd7a87e5376d7144d1e7e0eb3aae2127",
                ip_address="102.91.20.45",
                appareil="Samsung Galaxy S23 / Android 14",
                plateforme="android",
                expires_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc),
                revoque=False,
            ))
            print("  [OK] Session JWT")
        else:
            print("  [SKIP] Session JWT existe deja")
        db.flush()

        # ------------------------------------------------------------------
        # 18. AUDIT LOG
        # ------------------------------------------------------------------
        print("\n[18] Audit log...")
        db.add(AuditLog(
            utilisateur_id=ID_PATIENT,
            role_utilisateur="patient",
            session_id=ID_SESSION_JWT,
            action="connexion",
            entite_type="users",
            entite_id=ID_PATIENT,
            ip_address="102.91.20.45",
            donnees_avant=None,
            donnees_apres={"statut": "connexion_reussie"},
            succes=True,
            code_http=200,
        ))
        print("  [OK] Audit log")

        # ------------------------------------------------------------------
        # COMMIT FINAL
        # ------------------------------------------------------------------
        db.commit()
        print("\n=== SEED TERMINE AVEC SUCCES ===")
        print(f"  Utilisateur patient  : seed.patient1@nere-health.cm")
        print(f"  Utilisateur medecin  : seed.medecin1@nere-health.cm")
        print(f"  Mot de passe commun  : MotDePasse123!")

    except Exception as e:
        db.rollback()
        print(f"\n[ERREUR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run()
EOF
echo "Fichier cree"
wc -l /home/claude/seed.py
Sortie

Fichier cree
584 /home/claude/seed.py
Terminé