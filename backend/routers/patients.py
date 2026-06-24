from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


from models import Patient, DossierMedical, User
from datetime import date, datetime, timedelta

from auth import get_current_active_user, require_role
from db import get_db
from schemas import PatientCreate, PatientRead, ProfilUpdate

from sqlalchemy import func, or_

router = APIRouter(tags=["patients"])


@router.get("/patients", response_model=List[PatientRead])
async def read_patients(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patients = db.query(Patient).limit(limit).all()
    return patients


@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_create: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = Patient(**patient_create.dict())
    db.add(patient)
    try:
        db.commit()
        db.refresh(patient)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création du patient"
        if "uq_patients_numero_patient" in str(exc.orig):
            detail = "Ce numéro de patient est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return patient


@router.get("/patients/{patient_id}", response_model=PatientRead)
async def read_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")
    return patient




@router.get("/patients/me/profil")
async def get_my_profil(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")
    
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient introuvable")
    
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == current_user.id).first()
    
    # Calcul âge
    age = None
    if patient.date_naissance:
        today = date.today()
        age = today.year - patient.date_naissance.year - (
            (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
        )
    
    # Parser habitudes_vie (JSONB)
    habitudes = dossier.habitudes_vie if dossier and dossier.habitudes_vie else {}
    
    # Parser vaccinations (JSONB)
    vaccins = dossier.vaccinations if dossier and dossier.vaccinations else []
    
    # Parser traitements_chroniques
    traitements = dossier.traitements_chroniques if dossier and dossier.traitements_chroniques else []
    
    return {
        # Infos User
        "id": str(current_user.id),
        "email": current_user.email,
        "prenom": current_user.prenom,
        "nom": current_user.nom,
        "telephone": current_user.telephone,
        "statut": current_user.statut,
        
        # Infos Patient
        "numero_patient": patient.numero_patient,
        "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
        "age": age,
        "sexe": patient.sexe,
        "groupe_sanguin": patient.groupe_sanguin,
        "adresse": patient.adresse,
        "ville": patient.ville,
        "region": patient.region,
        "pays": patient.pays,
        "taille_cm": float(patient.taille_cm) if patient.taille_cm else None,
        "poids_kg": float(patient.poids_kg) if patient.poids_kg else None,
        "allergies": patient.allergies or [],
        "antecedents_medicaux": patient.antecedents_medicaux,
        "medicaments_en_cours": patient.medicaments_en_cours,
        "contact_urgence_nom": patient.contact_urgence_nom,
        "contact_urgence_tel": patient.contact_urgence_tel,
        "contact_urgence_lien": patient.contact_urgence_lien,
        
        # Infos DossierMedical
        "antecedents_familiaux": dossier.antecedents_familiaux if dossier else None,
        "antecedents_personnels": dossier.antecedents_personnels if dossier else None,
        "antecedents_chirurgicaux": dossier.antecedents_chirurgicaux if dossier else None,
        "antecedents_allergiques": dossier.antecedents_allergiques if dossier else None,
        "antecedents_gyneco": dossier.antecedents_gyneco if dossier else None,
        "habitudes_vie": habitudes,
        "vaccinations": vaccins,
        "traitements_chroniques": traitements,
    }


@router.put("/patients/me/profil")
async def update_my_profil(
    update: ProfilUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Met à jour le profil du patient connecté"""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")
    
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient introuvable")
    
    # Update Patient fields (only if provided)
    update_data = update.dict(exclude_unset=True)
    
    if "date_naissance" in update_data:
        patient.date_naissance = update_data["date_naissance"]
    if "sexe" in update_data:
        patient.sexe = update_data["sexe"]
    if "groupe_sanguin" in update_data:
        patient.groupe_sanguin = update_data["groupe_sanguin"]
    if "taille_cm" in update_data:
        patient.taille_cm = update_data["taille_cm"]
    if "poids_kg" in update_data:
        patient.poids_kg = update_data["poids_kg"]
    if "allergies" in update_data:
        patient.allergies = update_data["allergies"]
    if "antecedents_medicaux" in update_data:
        patient.antecedents_medicaux = update_data["antecedents_medicaux"]
    if "medicaments_en_cours" in update_data:
        patient.medicaments_en_cours = update_data["medicaments_en_cours"]
    if "contact_urgence_nom" in update_data:
        patient.contact_urgence_nom = update_data["contact_urgence_nom"]
    if "contact_urgence_tel" in update_data:
        patient.contact_urgence_tel = update_data["contact_urgence_tel"]
    if "contact_urgence_lien" in update_data:
        patient.contact_urgence_lien = update_data["contact_urgence_lien"]
    
    # Get or create DossierMedical
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == current_user.id).first()
    if not dossier:
        # Créer le dossier s'il n'existe pas
        numero_dossier = f"DM-{datetime.utcnow().year}-{str(current_user.id)[:8].upper()}"
        dossier = DossierMedical(
            numero_dossier=numero_dossier,
            patient_id=current_user.id,
        )
        db.add(dossier)
    
    # Update DossierMedical fields (only if provided)
    if "antecedents_familiaux" in update_data:
        dossier.antecedents_familiaux = update_data["antecedents_familiaux"]
    if "antecedents_personnels" in update_data:
        dossier.antecedents_personnels = update_data["antecedents_personnels"]
    if "antecedents_chirurgicaux" in update_data:
        dossier.antecedents_chirurgicaux = update_data["antecedents_chirurgicaux"]
    if "antecedents_allergiques" in update_data:
        dossier.antecedents_allergiques = update_data["antecedents_allergiques"]
    if "antecedents_gyneco" in update_data:
        dossier.antecedents_gyneco = update_data["antecedents_gyneco"]
    if "habitudes_vie" in update_data:
        dossier.habitudes_vie = update_data["habitudes_vie"]
    if "vaccinations" in update_data:
        dossier.vaccinations = update_data["vaccinations"]
    if "traitements_chroniques" in update_data:
        dossier.traitements_chroniques = update_data["traitements_chroniques"]
    
    try:
        db.commit()
        return {"message": "Profil mis à jour avec succès"}
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erreur de mise à jour: {exc.orig}"
        ) from exc







@router.get("/dashboard/patient")
async def get_dashboard_patient(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Dashboard agrégé pour le patient connecté."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")

    today = date.today()
    now = datetime.utcnow()

    from models import RendezVous, Medecin, Consultation, Ordonnance, OrdonnanceLigne, Notification, Specialite, MedecinSpecialite, DossierMedical

    # 1. Rendez-vous à venir
    rdv_a_venir = db.query(RendezVous).filter(
        RendezVous.patient_id == current_user.id,
        RendezVous.date_heure_debut > now,
        RendezVous.statut.in_(["en_attente", "confirme"])
    ).order_by(RendezVous.date_heure_debut).limit(1).first()

    prochain_rdv = None
    if rdv_a_venir:
        medecin = db.get(Medecin, rdv_a_venir.medecin_id)
        medecin_user = db.get(User, rdv_a_venir.medecin_id) if medecin else None
        prochain_rdv = {
            "id": str(rdv_a_venir.id),
            "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Dr. Inconnu",
            "medecin_initiale": medecin_user.prenom[0].upper() if medecin_user and medecin_user.prenom else "D",
            "date": rdv_a_venir.date_heure_debut.isoformat(),
            "type": rdv_a_venir.type,
            "motif": rdv_a_venir.motif_consultation or "Consultation",
            "statut": rdv_a_venir.statut,
            "lien_video": rdv_a_venir.lien_video,
        }

    # 2. Nombre de RDV à venir
    nb_rdv_a_venir = db.query(func.count(RendezVous.id)).filter(
        RendezVous.patient_id == current_user.id,
        RendezVous.date_heure_debut > now,
        RendezVous.statut.in_(["en_attente", "confirme"])
    ).scalar() or 0

    # 3. Consultations du mois
    debut_mois = today.replace(day=1)
    nb_consultations_mois = db.query(func.count(Consultation.id)).filter(
        Consultation.patient_id == current_user.id,
        Consultation.date_heure_debut >= datetime.combine(debut_mois, datetime.min.time())
    ).scalar() or 0

    # 4. Prescriptions actives
    nb_prescriptions = db.query(func.count(Ordonnance.id)).filter(
        Ordonnance.patient_id == current_user.id,
        Ordonnance.statut == "active",
        Ordonnance.date_expiration >= today
    ).scalar() or 0

    # 5. Consultations récentes
    consults_recentes = db.query(Consultation).filter(
        Consultation.patient_id == current_user.id
    ).order_by(Consultation.date_heure_debut.desc()).limit(5).all()

    consultations_list = []
    for c in consults_recentes:
        medecin_user = db.get(User, c.medecin_id)
        consultations_list.append({
            "id": str(c.id),
            "medecin": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Dr. Inconnu",
            "medecin_initiale": medecin_user.prenom[0].upper() if medecin_user and medecin_user.prenom else "D",
            "motif": c.motif or "Consultation",
            "date": c.date_heure_debut.isoformat() if c.date_heure_debut else None,
            "statut": c.statut or "termine",
        })

    # 6. Médicaments du jour
    ordonnances_actives = db.query(Ordonnance).filter(
        Ordonnance.patient_id == current_user.id,
        Ordonnance.statut == "active",
        Ordonnance.date_expiration >= today
    ).all()

    medicaments_jour = []
    for ord in ordonnances_actives:
        lignes = db.query(OrdonnanceLigne).filter(
            OrdonnanceLigne.ordonnance_id == ord.id
        ).all()
        for ligne in lignes:
            medicaments_jour.append({
                "id": str(ligne.id),
                "nom": f"{ligne.medicament_nom} {ligne.dosage}",
                "frequence": ligne.frequence_par_jour,
                "posologie": ligne.posologie or "",
            })

    # 7. Notifications non lues
    nb_notifs_non_lues = db.query(func.count(Notification.id)).filter(
        Notification.utilisateur_id == current_user.id,
        Notification.date_lecture.is_(None)
    ).scalar() or 0

    # 8. Spécialités
    specialites_list = db.query(Specialite).filter(
        Specialite.actif == True
    ).order_by(Specialite.ordre_affichage).all()

    specialites_data = [
        {"id": str(s.id), "nom": s.libelle_fr, "icone": s.icone_url or s.code}
        for s in specialites_list
    ]

    # 9. Résumé santé
    patient = db.get(Patient, current_user.id)
    resume_sante = {}
    if patient:
        poids = float(patient.poids_kg) if patient.poids_kg else None
        taille_m = float(patient.taille_cm) / 100 if patient.taille_cm else None
        imc = round(poids / (taille_m ** 2), 1) if poids and taille_m else None

        resume_sante = {
            "poids_kg": poids,
            "taille_cm": float(patient.taille_cm) if patient.taille_cm else None,
            "imc": imc,
            "groupe_sanguin": patient.groupe_sanguin,
        }

    return {
        "patient_nom": f"{current_user.prenom} {current_user.nom}",
        "patient_initiale": current_user.prenom[0].upper() if current_user.prenom else "P",
        "prochain_rdv": prochain_rdv,
        "nb_rdv_a_venir": nb_rdv_a_venir,
        "nb_consultations_mois": nb_consultations_mois,
        "nb_prescriptions": nb_prescriptions,
        "consultations_recentes": consultations_list,
        "medicaments_jour": medicaments_jour,
        "nb_notifications_non_lues": nb_notifs_non_lues,
        "specialites": specialites_data,
        "resume_sante": resume_sante,
    }