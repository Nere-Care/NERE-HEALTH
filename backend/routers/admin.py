


from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, date, timedelta

from auth import get_current_active_user
from db import get_db

from models import User, Patient, Medecin, RendezVous, MedecinSpecialite, Specialite, Structure, DossierMedical, Paiement, Notification
from services.email_service import envoyer_email, email_medecin_valide, email_medecin_rejete

import asyncio








# ... (tes autres routes admin) ...



router = APIRouter(tags=["admin"])


def require_admin(current_user=Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Reserve aux administrateurs")
    return current_user


@router.get("/admin/patients")
async def admin_list_patients(
    search: Optional[str] = None,
    telephone: Optional[str] = None,
    sexe: Optional[str] = None,
    groupe_sanguin: Optional[str] = None,
    statut: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = select(User, Patient).join(Patient, Patient.id == User.id)

    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(User.email).like(kw),
                func.lower(Patient.numero_patient).like(kw),
            )
        )
    if telephone:
        stmt = stmt.where(User.telephone.ilike(f"%{telephone}%"))
    if sexe and sexe in ("M", "F"):
        stmt = stmt.where(Patient.sexe == sexe)
    if groupe_sanguin:
        stmt = stmt.where(Patient.groupe_sanguin == groupe_sanguin)
    if statut:
        stmt = stmt.where(User.statut == statut)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
    rows = db.execute(stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)).all()

    today = date.today()

    result = []
    for user, patient in rows:
        # Dernier RDV
        dernier_rdv = db.query(RendezVous).filter(
            RendezVous.patient_id == user.id
        ).order_by(RendezVous.date_heure_debut.desc()).first()

        # Calcul âge
        age = None
        if patient.date_naissance:
            age = today.year - patient.date_naissance.year - (
                (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
            )

        # Dernière connexion
        derniere_connexion = "Jamais"
        if user.updated_at:
            diff = datetime.now(timezone.utc) - user.updated_at.replace(tzinfo=timezone.utc)
            if diff.days == 0:
                if diff.seconds < 3600:
                    derniere_connexion = f"Il y a {diff.seconds // 60} min"
                else:
                    derniere_connexion = f"Il y a {diff.seconds // 3600}h"
            elif diff.days == 1:
                derniere_connexion = "Hier"
            else:
                derniere_connexion = f"Il y a {diff.days} jours"

        result.append({
            "id": str(user.id),
            "nom": user.nom or "",
            "prenom": user.prenom or "",
            "email": user.email or "",
            "telephone": user.telephone or "",
            "statut": user.statut or "actif",
            "numero_patient": patient.numero_patient or "",
            "sexe": "Masculin" if patient.sexe == "M" else "Féminin" if patient.sexe == "F" else "N/A",
            "sexe_raw": patient.sexe or "",
            "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
            "age": age,
            "groupe_sanguin": patient.groupe_sanguin or "N/A",
            "ville": patient.ville or "N/A",
            "pays": patient.pays or "CM",
            "allergies": ", ".join(patient.allergies) if patient.allergies else "Aucune",
            "allergies_list": patient.allergies or [],
            "antecedents": patient.antecedents_medicaux or "Aucun",
            "couverture": patient.couverture_assurance or "Non renseigné",
            "nb_rdv": db.query(func.count(RendezVous.id)).filter(RendezVous.patient_id == user.id).scalar() or 0,
            "dernier_rdv": dernier_rdv.date_heure_debut.strftime("%d/%m/%Y") if dernier_rdv else "Aucun",
            "derniereConnexion": derniere_connexion,
            "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
        })

    return {"patients": result, "total": total}


@router.get("/admin/patients/activite")
async def admin_activite_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    depuis = datetime.now(timezone.utc) - timedelta(hours=24)

    # Nouvelles consultations
    nouvelles_consults = db.query(RendezVous).filter(
        RendezVous.created_at >= depuis,
    ).order_by(RendezVous.created_at.desc()).limit(10).all()

    result = []
    for rdv in nouvelles_consults:
        patient_user = db.get(User, rdv.patient_id)
        if not patient_user:
            continue
        diff = datetime.now(timezone.utc) - rdv.created_at.replace(tzinfo=timezone.utc)
        if diff.seconds < 3600:
            temps = f"Il y a {diff.seconds // 60} min"
        elif diff.days == 0:
            temps = f"Il y a {diff.seconds // 3600}h"
        else:
            temps = f"Il y a {diff.days} jour(s)"

        result.append({
            "id": str(rdv.id),
            "action": "Nouvelle consultation" if rdv.statut == "confirme" else "Demande de RDV",
            "patient": f"{patient_user.prenom} {patient_user.nom}",
            "time": temps,
        })

    # Nouveaux patients (inscrits dans les 24h)
    nouveaux_patients = db.query(User).join(Patient, Patient.id == User.id).filter(
        User.role == "patient",
        User.created_at >= depuis,
    ).order_by(User.created_at.desc()).limit(5).all()

    for user in nouveaux_patients:
        diff = datetime.now(timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)
        temps = f"Il y a {diff.seconds // 60} min" if diff.seconds < 3600 else f"Il y a {diff.seconds // 3600}h"
        result.append({
            "id": str(user.id),
            "action": "Patient ajouté",
            "patient": f"{user.prenom} {user.nom}",
            "time": temps,
        })

    result.sort(key=lambda x: x["time"])
    return result[:10]


@router.get("/admin/stats/patients")
async def admin_stats_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    today = date.today()

    total = db.execute(
        select(func.count(Patient.id))
    ).scalar() or 0

    actifs = db.execute(
        select(func.count(User.id))
        .join(Patient, Patient.id == User.id)
        .where(User.statut == "actif")
    ).scalar() or 0

    consultations_today = db.execute(
        select(func.count(RendezVous.id))
        .where(func.date(RendezVous.date_heure_debut) == today)
    ).scalar() or 0

    avec_allergies = db.execute(
        select(func.count(Patient.id))
        .where(Patient.allergies != None)
        .where(func.array_length(Patient.allergies, 1) > 0)
    ).scalar() or 0

    nouveaux_semaine = db.execute(
        select(func.count(User.id))
        .join(Patient, Patient.id == User.id)
        .where(User.role == "patient")
        .where(func.date(User.created_at) >= today - timedelta(days=7))
    ).scalar() or 0

    dossiers_incomplets = db.execute(
        select(func.count(Patient.id))
        .where(
            or_(
                Patient.date_naissance == None,
                Patient.sexe == None,
                Patient.groupe_sanguin == None,
            )
        )
    ).scalar() or 0

    return {
        "total": total,
        "actifs": actifs,
        "consultations_today": consultations_today,
        "avec_allergies": avec_allergies,
        "nouveaux_semaine": nouveaux_semaine,
        "dossiers_incomplets": dossiers_incomplets,
    }


@router.get("/admin/patients/{patient_id}")
async def admin_get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    patient = db.get(Patient, patient_id)
    if not user or not patient:
        raise HTTPException(404, "Patient introuvable")

    dossier = db.query(DossierMedical).filter(
        DossierMedical.patient_id == patient_id
    ).first()

    rdvs = db.query(RendezVous).filter(
        RendezVous.patient_id == patient_id
    ).order_by(RendezVous.date_heure_debut.desc()).limit(10).all()

    # 1. Calcul de l'âge
    age = None
    if patient.date_naissance:
        today = date.today()
        age = today.year - patient.date_naissance.year - (
            (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
        )

    # 2. Calcul de la dernière connexion (en utilisant le champ last_login du modèle User)
    derniere_connexion = "Jamais"
    if user.last_login:
        diff = datetime.now(timezone.utc) - user.last_login.replace(tzinfo=timezone.utc)
        if diff.days == 0:
            if diff.seconds < 3600:
                derniere_connexion = f"Il y a {diff.seconds // 60} min"
            else:
                derniere_connexion = f"Il y a {diff.seconds // 3600}h"
        elif diff.days == 1:
            derniere_connexion = "Hier"
        else:
            derniere_connexion = f"Il y a {diff.days} jours"

    # 3. Récupération du Médecin en charge (Médecin traitant du dossier OU dernier médecin d'un RDV confirmé)
    medecin_nom = "Non assigné"
    medecin_id_to_check = None

    if dossier and dossier.medecin_traitant_id:
        medecin_id_to_check = dossier.medecin_traitant_id
    else:
        # Fallback : on prend le médecin du dernier RDV confirmé ou terminé
        dernier_rdv_valide = next((r for r in rdvs if r.statut in ["confirme", "termine", "en_cours"] and r.medecin_id), None)
        if dernier_rdv_valide:
            medecin_id_to_check = dernier_rdv_valide.medecin_id

    if medecin_id_to_check:
        medecin_user = db.query(User).join(Medecin, Medecin.id == User.id).filter(Medecin.id == medecin_id_to_check).first()
        if medecin_user:
            medecin_nom = f"Dr. {medecin_user.prenom or ''} {medecin_user.nom or ''}".strip()

    return {
        "id": str(user.id),
        "nom": user.nom or "",
        "prenom": user.prenom or "",
        "email": user.email or "",
        "telephone": user.telephone or "",
        "statut": user.statut or "actif",
        "numero_patient": patient.numero_patient or "",
        "sexe": "Masculin" if patient.sexe == "M" else "Féminin" if patient.sexe == "F" else "Non précisé",
        "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
        "age": age,
        "groupe_sanguin": patient.groupe_sanguin or "Inconnu",
        "ville": patient.ville or "",
        "pays": patient.pays or "CM",
        "allergies": patient.allergies or [],
        "antecedents_medicaux": patient.antecedents_medicaux or "",
        "couverture_assurance": patient.couverture_assurance or "",
        "contact_urgence_nom": patient.contact_urgence_nom or "",
        "contact_urgence_tel": patient.contact_urgence_tel or "",
        
        # ✅ NOUVEAUX CHAMPS AJOUTÉS ICI :
        "medecin_traitant": medecin_nom,
        "derniereConnexion": derniere_connexion,
        
        "dossier": {
            "antecedents_familiaux": dossier.antecedents_familiaux if dossier else "",
            "antecedents_personnels": dossier.antecedents_personnels if dossier else "",
            "habitudes_vie": dossier.habitudes_vie if dossier else {},
            "vaccinations": dossier.vaccinations if dossier else [],
        } if dossier else None,
        "rendez_vous": [
            {
                "id": str(r.id),
                "date": r.date_heure_debut.strftime("%d/%m/%Y %H:%M") if r.date_heure_debut else "",
                "type": r.type,
                "statut": r.statut,
                "motif": r.motif_consultation or "",
            }
            for r in rdvs
        ],
        "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
    }


@router.put("/admin/patients/{patient_id}")
async def admin_update_patient(
    patient_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    patient = db.get(Patient, patient_id)
    if not user or not patient:
        raise HTTPException(404, "Patient introuvable")

    # 1. Gestion du statut (conversion Frontend -> Backend)
    # 1. Gestion du statut
    if "statut" in payload:
        statut_raw = payload["statut"].lower().strip()

        if statut_raw == "actif":
            user.statut = "actif"

        elif statut_raw == "inactif":
            user.statut = "inactif"

        elif statut_raw == "suspendu":
            user.statut = "suspendu"

        elif statut_raw in ["en attente", "en_attente"]:
            user.statut = "en_attente"

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Statut invalide : '{payload['statut']}'"
        )

    # 2. Gestion du nom (le frontend envoie "Prénom Nom" dans un seul champ)
    if "nom" in payload:
        parts = payload["nom"].strip().split(" ", 1)
        user.prenom = parts[0] if len(parts) > 0 else user.prenom
        user.nom = parts[1] if len(parts) > 1 else user.nom

    # 3. Téléphone et Email
    if "telephone" in payload:
        user.telephone = payload["telephone"]
    if "email" in payload:
        user.email = payload["email"]

    # 4. Sexe (conversion "Masculin" -> "M")
    if "sexe" in payload:
        sexe_raw = payload["sexe"].lower()
        if "masculin" in sexe_raw:
            patient.sexe = "M"
        elif "féminin" in sexe_raw or "feminin" in sexe_raw:
            patient.sexe = "F"
        else:
            patient.sexe = "Non_precise"

    # 5. Adresse / Ville
    if "adresse" in payload:
        patient.ville = payload["adresse"]

    # 6. Groupe sanguin
    if "groupe" in payload or "groupe_sanguin" in payload:
        gs = (payload.get("groupe") or payload.get("groupe_sanguin")).upper()
        if gs in ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "INCONNU"]:
            patient.groupe_sanguin = gs if gs != "INCONNU" else "Inconnu"

    # 7. Assurance / Couverture
    if "assurance" in payload:
        patient.couverture_assurance = payload["assurance"]

    # 8. Allergies (conversion d'une chaîne "A, B" en liste ["A", "B"])
    if "allergies" in payload:
        al = payload["allergies"]
        if isinstance(al, str):
            patient.allergies = [a.strip() for a in al.split(",") if a.strip()]
        elif isinstance(al, list):
            patient.allergies = al

    # 9. Antécédents
    if "antecedents" in payload:
        patient.antecedents_medicaux = payload["antecedents"]

    # Sauvegarde en base

    print("========== AVANT COMMIT ==========")
    print("USER :", user.id)
    print("PATIENT :", patient.id)
    print("Nom :", user.nom)
    print("Prénom :", user.prenom)
    print("Téléphone :", user.telephone)
    print("Statut :", user.statut)
    print("Ville :", patient.ville)
    print("==================================")
    db.commit()
    db.commit()

    print("========== APRES COMMIT ==========")
    print("COMMIT EFFECTUE")
    print("==================================")
    db.refresh(user)
    db.refresh(patient)
    
    return {
        "message": "Patient mis à jour avec succès",
        "id": str(user.id)
    }


@router.delete("/admin/patients/{patient_id}")
async def admin_delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    if not user:
        raise HTTPException(404, "Patient introuvable")
    user.statut = "inactif"
    db.commit()
    return {"message": "Patient désactivé"}






@router.get("/admin/me")
async def admin_me(
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Acces refuse — role admin requis")
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "role": current_user.role,
        "statut": current_user.statut,
    }









# ... (Garde tes routes /admin/patients ici) ...


# ==========================================
# ROUTES MÉDECINS (Version Sécurisée)
# ==========================================


@router.get("/admin/medecins")
async def admin_list_medecins(
    search: Optional[str] = None,
    specialite: Optional[str] = None,
    statut_verification: Optional[str] = None,
    statut_compte: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = select(User, Medecin).join(Medecin, Medecin.id == User.id)

    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(User.email).like(kw),
                func.lower(Medecin.numero_ordre).like(kw),
            )
        )
    if statut_verification:
        stmt = stmt.where(Medecin.statut_verification == statut_verification)
    if statut_compte:
        stmt = stmt.where(User.statut == statut_compte)

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar() or 0

    rows = db.execute(
        stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
    ).all()

    result = []
    for user, medecin in rows:
        # Spécialités
        specs = db.query(Specialite).join(
            MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id
        ).filter(MedecinSpecialite.medecin_id == user.id).all()

        # Filtrer par spécialité si demandé
        spec_labels = [s.libelle_fr for s in specs]
        if specialite and specialite not in spec_labels:
            continue

        # Structure
        structure_nom = ""
        if medecin.structure_id:
            struct = db.get(Structure, medecin.structure_id)
            if struct:
                structure_nom = struct.nom_etablissement

        # Nb consultations
        nb_rdv = db.query(func.count(RendezVous.id)).filter(
            RendezVous.medecin_id == user.id,
            RendezVous.statut == "termine",
        ).scalar() or 0

        # Revenus (paiements confirmés)
        from models import Paiement
        from sqlalchemy import func as sqlfunc
        revenus = db.execute(
            select(sqlfunc.sum(Paiement.montant_total - sqlfunc.coalesce(Paiement.frais_plateforme, 0)))
            .where(Paiement.medecin_id == user.id)
            .where(Paiement.statut == "confirme")
        ).scalar() or 0

        result.append({
            "id": str(user.id),
            "nom": user.nom or "",
            "prenom": user.prenom or "",
            "email": user.email or "",
            "telephone": user.telephone or "",
            "statut": user.statut or "actif",
            "statut_verification": medecin.statut_verification or "en_attente",
            "numero_ordre": medecin.numero_ordre or "",
            "specialites": spec_labels,
            "specialite_principale": spec_labels[0] if spec_labels else "N/A",
            "structure": structure_nom or "Cabinet indépendant",
            "annees_experience": medecin.annees_experience or 0,
            "tarif_consultation": float(medecin.tarif_consultation or 0),
            "devise": medecin.devise or "XAF",
            "teleconsultation": bool(medecin.teleconsultation_active),
            "disponible": bool(medecin.disponible_maintenant),
            "note_moyenne": float(medecin.note_moyenne or 0),
            "nb_consultations": nb_rdv,
            "revenus_total": float(revenus),
            "langues": medecin.langues_parlees or [],
            "biographie": medecin.biographie or "",
            "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
        })

    return {"medecins": result, "total": total}


@router.get("/admin/stats/medecins")
async def admin_stats_medecins(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    total = db.execute(select(func.count(Medecin.id))).scalar() or 0

    verifies = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.statut_verification == "verifie")
    ).scalar() or 0

    en_attente = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.statut_verification == "en_attente")
    ).scalar() or 0

    disponibles = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.disponible_maintenant == True)
    ).scalar() or 0

    from models import Paiement
    revenus_total = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(Paiement.statut == "confirme")
    ).scalar() or 0

    return {
        "total": total,
        "verifies": verifies,
        "en_attente_verification": en_attente,
        "disponibles": disponibles,
        "revenus_total_plateforme": float(revenus_total),
    }


@router.get("/admin/medecins/{medecin_id}")
async def admin_get_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user    = db.get(User,    medecin_id)
    medecin = db.get(Medecin, medecin_id)
    if not user or not medecin:
        raise HTTPException(404, "Médecin introuvable")

    specs = db.query(Specialite).join(
        MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id
    ).filter(MedecinSpecialite.medecin_id == medecin_id).all()

    structure_nom = ""
    if medecin.structure_id:
        struct = db.get(Structure, medecin.structure_id)
        if struct:
            structure_nom = struct.nom_etablissement

    rdvs = db.query(RendezVous).filter(
        RendezVous.medecin_id == medecin_id
    ).order_by(RendezVous.date_heure_debut.desc()).limit(10).all()

    from models import Paiement
    revenus = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(Paiement.medecin_id == medecin_id)
        .where(Paiement.statut == "confirme")
    ).scalar() or 0

    return {
        "id": str(user.id),
        "nom": user.nom or "",
        "prenom": user.prenom or "",
        "email": user.email or "",
        "telephone": user.telephone or "",
        "statut": user.statut or "actif",
        "statut_verification": medecin.statut_verification or "en_attente",
        "numero_ordre": medecin.numero_ordre or "",
        "specialites": [s.libelle_fr for s in specs],
        "structure": structure_nom,
        "annees_experience": medecin.annees_experience or 0,
        "tarif_consultation": float(medecin.tarif_consultation or 0),
        "devise": medecin.devise or "XAF",
        "teleconsultation": bool(medecin.teleconsultation_active),
        "disponible": bool(medecin.disponible_maintenant),
        "note_moyenne": float(medecin.note_moyenne or 0),
        "biographie": medecin.biographie or "",
        "langues": medecin.langues_parlees or [],
        "revenus_total": float(revenus),
        "nb_consultations": db.query(func.count(RendezVous.id)).filter(
            RendezVous.medecin_id == medecin_id,
            RendezVous.statut == "termine",
        ).scalar() or 0,
        "rendez_vous": [
            {
                "id": str(r.id),
                "date": r.date_heure_debut.strftime("%d/%m/%Y %H:%M"),
                "type": r.type,
                "statut": r.statut,
                "motif": r.motif_consultation or "",
            }
            for r in rdvs
        ],
        "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
    }





@router.delete("/admin/medecins/{medecin_id}")
async def admin_delete_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, medecin_id)
    if not user:
        raise HTTPException(404, "Médecin introuvable")
    user.statut = "inactif"
    db.commit()
    return {"message": "Médecin désactivé"}



@router.get("/admin/medecins/{medecin_id}/documents")
async def admin_medecin_documents(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    from models import DocumentMedical
    docs = db.query(DocumentMedical).filter(
        DocumentMedical.medecin_uploadeur_id == medecin_id,
    ).order_by(DocumentMedical.created_at.desc()).all()

    return [
        {
            "id": str(d.id),
            "name": d.nom_fichier_original,
            "size": f"{(d.taille_octets / 1024):.0f} Ko" if d.taille_octets < 1024*1024 else f"{(d.taille_octets/(1024*1024)):.1f} Mo",
            "mime_type": d.mime_type,
            "url": d.url_stockage,
            "date": d.created_at.strftime("%d/%m/%Y") if d.created_at else "",
        }
        for d in docs
    ]











@router.post("/admin/rendez-vous")
async def admin_create_rdv(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # Vérifie que patient et medecin existent
    if not db.get(User, payload.get("patient_id")) or not db.get(User, payload.get("medecin_id")):
        raise HTTPException(400, "Patient ou Médecin introuvable")

    new_rdv = RendezVous(
        patient_id=payload.get("patient_id"),
        medecin_id=payload.get("medecin_id"),
        structure_id=payload.get("structure_id"),
        motif_consultation=payload.get("motif_consultation"),
        type=payload.get("type", "presentiel"),
        lieu_consultation=payload.get("lieu_consultation"),
        lien_visio=payload.get("lien_visio"),
        date_heure_debut=datetime.fromisoformat(payload.get("date_heure_debut")),
        statut=payload.get("statut", "en_attente"),
    )
    db.add(new_rdv)
    db.commit()
    db.refresh(new_rdv)
    return {"message": "Rendez-vous créé", "id": str(new_rdv.id)}


@router.patch("/admin/rendez-vous/{rdv_id}/statut")
async def admin_update_rdv_statut(
    rdv_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "Rendez-vous introuvable")
    
    nouveau_statut = payload.get("statut")
    if nouveau_statut not in ["confirme", "annule", "en_attente", "termine"]:
        raise HTTPException(400, "Statut invalide")
        
    rdv.statut = nouveau_statut
    db.commit()
    return {"message": f"Statut mis à jour: {nouveau_statut}"}










@router.get("/admin/rendez-vous")
async def admin_list_rendez_vous(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    type: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = (
        select(RendezVous, User)
        .join(User, RendezVous.patient_id == User.id)
    )

    if statut:
        stmt = stmt.where(RendezVous.statut == statut)
    if type:
        stmt = stmt.where(RendezVous.type == type)
    if date_debut:
        try:
            d = datetime.fromisoformat(date_debut)
            stmt = stmt.where(RendezVous.date_heure_debut >= d)
        except ValueError:
            pass
    if date_fin:
        try:
            d = datetime.fromisoformat(date_fin)
            stmt = stmt.where(RendezVous.date_heure_debut <= d)
        except ValueError:
            pass
    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(RendezVous.numero_rdv).like(kw),
            )
        )

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0

    rows = db.execute(
        stmt.order_by(RendezVous.date_heure_debut.desc()).limit(limit).offset(offset)
    ).all()

    result = []
    for rdv, patient_user in rows:
        medecin_user = db.get(User, rdv.medecin_id)
        result.append({
            "id": str(rdv.id),
            "numero_rdv": rdv.numero_rdv,
            "patient_nom": f"{patient_user.prenom} {patient_user.nom}" if patient_user else "N/A",
            "patient_id": str(rdv.patient_id),
            "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "N/A",
            "medecin_id": str(rdv.medecin_id) if rdv.medecin_id else None,
            "date": rdv.date_heure_debut.strftime("%d/%m/%Y") if rdv.date_heure_debut else "",
            "heure": rdv.date_heure_debut.strftime("%H:%M") if rdv.date_heure_debut else "",
            "type": rdv.type,
            "statut": rdv.statut,
            "motif": rdv.motif_consultation or "",
            "montant": float(rdv.montant) if rdv.montant else 0,
            "devise": rdv.devise or "XAF",
            "created_at": rdv.created_at.strftime("%d/%m/%Y") if rdv.created_at else "",
        })

    return {"rendez_vous": result, "total": total}


@router.get("/admin/stats/rendez-vous")
async def admin_stats_rendez_vous(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    total = db.execute(select(func.count(RendezVous.id))).scalar() or 0

    en_attente = db.execute(
        select(func.count(RendezVous.id)).where(RendezVous.statut == "en_attente")
    ).scalar() or 0

    confirmes = db.execute(
        select(func.count(RendezVous.id)).where(RendezVous.statut == "confirme")
    ).scalar() or 0

    termines = db.execute(
        select(func.count(RendezVous.id)).where(RendezVous.statut == "termine")
    ).scalar() or 0

    annules = db.execute(
        select(func.count(RendezVous.id)).where(
            RendezVous.statut.in_(["annule_patient", "annule_medecin"])
        )
    ).scalar() or 0

    today = date.today()
    aujourdhui = db.execute(
        select(func.count(RendezVous.id)).where(
            func.date(RendezVous.date_heure_debut) == today
        )
    ).scalar() or 0

    return {
        "total": total,
        "en_attente": en_attente,
        "confirmes": confirmes,
        "termines": termines,
        "annules": annules,
        "aujourdhui": aujourdhui,
    }


@router.get("/admin/rendez-vous/{rdv_id}")
async def admin_get_rendez_vous(
    rdv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "RDV introuvable")

    patient_user = db.get(User, rdv.patient_id)
    medecin_user = db.get(User, rdv.medecin_id) if rdv.medecin_id else None

    from models import Paiement
    paiement = db.query(Paiement).filter(Paiement.rdv_id == rdv_id).first()

    return {
        "id": str(rdv.id),
        "numero_rdv": rdv.numero_rdv,
        "patient_nom": f"{patient_user.prenom} {patient_user.nom}" if patient_user else "N/A",
        "patient_email": patient_user.email if patient_user else "",
        "patient_telephone": patient_user.telephone if patient_user else "",
        "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "N/A",
        "date": rdv.date_heure_debut.strftime("%d/%m/%Y %H:%M") if rdv.date_heure_debut else "",
        "type": rdv.type,
        "statut": rdv.statut,
        "motif": rdv.motif_consultation or "",
        "montant": float(rdv.montant) if rdv.montant else 0,
        "devise": rdv.devise or "XAF",
        "paiement": {
            "reference": paiement.reference,
            "statut": paiement.statut,
            "methode": paiement.methode,
        } if paiement else None,
    }











@router.get("/admin/paiements")
async def admin_list_paiements(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    methode: Optional[str] = None,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = (
        select(Paiement, User)
        .join(User, Paiement.patient_id == User.id)
    )

    if statut:
        stmt = stmt.where(Paiement.statut == statut)
    if methode:
        stmt = stmt.where(Paiement.methode == methode)
    if date_debut:
        try:
            d = datetime.fromisoformat(date_debut)
            stmt = stmt.where(Paiement.created_at >= d)
        except ValueError:
            pass
    if date_fin:
        try:
            d = datetime.fromisoformat(date_fin)
            stmt = stmt.where(Paiement.created_at <= d)
        except ValueError:
            pass
    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(Paiement.reference).like(kw),
            )
        )

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0

    rows = db.execute(
        stmt.order_by(Paiement.created_at.desc()).limit(limit).offset(offset)
    ).all()

    result = []
    for p, patient_user in rows:
        medecin_user = db.get(User, p.medecin_id) if p.medecin_id else None
        result.append({
            "id": str(p.id),
            "reference": p.reference,
            "patient_nom": f"{patient_user.prenom} {patient_user.nom}" if patient_user else "N/A",
            "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "N/A",
            "montant_total": float(p.montant_total or 0),
            "frais_plateforme": float(p.frais_plateforme or 0),
            "montant_net": float((p.montant_total or 0) - (p.frais_plateforme or 0)),
            "devise": p.devise or "XAF",
            "methode": p.methode,
            "fournisseur": p.fournisseur,
            "statut": p.statut,
            "date": p.created_at.strftime("%d/%m/%Y") if p.created_at else "",
            "heure": p.created_at.strftime("%H:%M") if p.created_at else "",
        })

    return {"paiements": result, "total": total}


@router.get("/admin/stats/paiements")
async def admin_stats_paiements(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    total_transactions = db.execute(select(func.count(Paiement.id))).scalar() or 0

    volume_total = db.execute(
        select(func.sum(Paiement.montant_total)).where(Paiement.statut == "confirme")
    ).scalar() or 0

    commissions_total = db.execute(
        select(func.sum(Paiement.frais_plateforme)).where(Paiement.statut == "confirme")
    ).scalar() or 0

    en_attente = db.execute(
        select(func.count(Paiement.id)).where(Paiement.statut.in_(["initie", "en_attente"]))
    ).scalar() or 0

    confirmes = db.execute(
        select(func.count(Paiement.id)).where(Paiement.statut == "confirme")
    ).scalar() or 0

    echoues = db.execute(
        select(func.count(Paiement.id)).where(Paiement.statut.in_(["echoue", "annule"]))
    ).scalar() or 0

    today = date.today()
    debut_mois = today.replace(day=1)
    volume_mois = db.execute(
        select(func.sum(Paiement.montant_total))
        .where(Paiement.statut == "confirme")
        .where(func.date(Paiement.created_at) >= debut_mois)
    ).scalar() or 0

    return {
        "total_transactions": total_transactions,
        "volume_total": float(volume_total),
        "commissions_total": float(commissions_total),
        "en_attente": en_attente,
        "confirmes": confirmes,
        "echoues": echoues,
        "volume_mois": float(volume_mois),
    }


@router.get("/admin/paiements/{paiement_id}")
async def admin_get_paiement(
    paiement_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    p = db.get(Paiement, paiement_id)
    if not p:
        raise HTTPException(404, "Paiement introuvable")

    patient_user = db.get(User, p.patient_id) if p.patient_id else None
    medecin_user = db.get(User, p.medecin_id) if p.medecin_id else None
    rdv = db.get(RendezVous, p.rdv_id) if p.rdv_id else None

    return {
        "id": str(p.id),
        "reference": p.reference,
        "reference_fournisseur": p.reference_fournisseur or "",
        "patient_nom": f"{patient_user.prenom} {patient_user.nom}" if patient_user else "N/A",
        "patient_email": patient_user.email if patient_user else "",
        "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "N/A",
        "montant_total": float(p.montant_total or 0),
        "frais_plateforme": float(p.frais_plateforme or 0),
        "taux_commission": float(p.taux_commission or 0),
        "devise": p.devise or "XAF",
        "methode": p.methode,
        "fournisseur": p.fournisseur,
        "statut": p.statut,
        "motif_remboursement": p.motif_remboursement or "",
        "date_creation": p.created_at.strftime("%d/%m/%Y %H:%M") if p.created_at else "",
        "rdv": {
            "numero_rdv": rdv.numero_rdv,
            "motif": rdv.motif_consultation or "",
            "date": rdv.date_heure_debut.strftime("%d/%m/%Y %H:%M") if rdv.date_heure_debut else "",
        } if rdv else None,
    }


@router.patch("/admin/paiements/{paiement_id}/statut")
async def admin_update_paiement_statut(
    paiement_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    p = db.get(Paiement, paiement_id)
    if not p:
        raise HTTPException(404, "Paiement introuvable")

    nouveau_statut = payload.get("statut")
    statuts_valides = ["initie", "en_attente", "confirme", "echoue", "rembourse", "annule"]
    if nouveau_statut not in statuts_valides:
        raise HTTPException(400, f"Statut invalide : {statuts_valides}")

    p.statut = nouveau_statut
    if payload.get("motif_remboursement"):
        p.motif_remboursement = payload["motif_remboursement"]

    db.commit()
    return {"message": "Statut mis à jour", "statut": p.statut}










@router.get("/admin/conversations")
async def admin_list_conversations(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    risque: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # Import local pour éviter les conflits de circularité
    from models import Conversation, Message, User

    # 1. Requête de base
    stmt = select(Conversation)
    
    # 2. Application des filtres
    if statut:
        stmt = stmt.where(Conversation.statut == statut)
    if risque:
        stmt = stmt.where(Conversation.niveau_risque == risque)
    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.join(User, Conversation.patient_id == User.id).where(
            or_(func.lower(User.prenom).like(kw), func.lower(User.nom).like(kw))
        )

    # 3. Comptage total (gère correctement le JOIN si la recherche est active)
    if search:
        count_stmt = select(func.count(Conversation.id)).join(User, Conversation.patient_id == User.id).where(
            or_(func.lower(User.prenom).like(kw), func.lower(User.nom).like(kw))
        )
        if statut: count_stmt = count_stmt.where(Conversation.statut == statut)
        if risque: count_stmt = count_stmt.where(Conversation.niveau_risque == risque)
    else:
        count_stmt = select(func.count(Conversation.id))
        if statut: count_stmt = count_stmt.where(Conversation.statut == statut)
        if risque: count_stmt = count_stmt.where(Conversation.niveau_risque == risque)

    total = db.execute(count_stmt).scalar() or 0

    # 4. Récupération des données avec pagination
    # ✅ CORRECTION ICI : On trie par created_at car last_message_at n'existe pas dans ton modèle
    convs = db.execute(
        stmt.order_by(Conversation.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()

    # 5. Formatage de la réponse pour le frontend
    result = []
    for c in convs:
        patient = db.get(User, c.patient_id)
        medecin = db.get(User, c.medecin_id)
        
        # Récupérer tous les messages de cette conversation dans l'ordre chronologique
        msgs = db.query(Message).filter(
            Message.conversation_id == c.id
        ).order_by(Message.created_at.asc()).all()
        
        messages_formatted = []
        admin_messages_formatted = []
        
        for m in msgs:
            msg_data = {
                "id": str(m.id),
                "from": getattr(m, 'expediteur_type', 'unknown'), # 'patient', 'medecin', ou 'admin'
                "text": getattr(m, 'contenu', ''),
                "time": m.created_at.strftime("%H:%M") if m.created_at else "",
                "flagged": getattr(m, 'signale', False),
                "flagReason": getattr(m, 'motif_signalement', None) if getattr(m, 'signale', False) else None
            }
            
            if msg_data["from"] == "admin":
                admin_messages_formatted.append(msg_data)
            else:
                messages_formatted.append(msg_data)

        # ✅ SÉCURISATION : Utilise last_message_at s'il existe, sinon fallback sur created_at
        last_msg_time = getattr(c, 'last_message_at', None) or c.created_at

        result.append({
            "id": str(c.id),
            "patient_id": str(c.patient_id) if c.patient_id else None,
            "medecin_id": str(c.medecin_id) if c.medecin_id else None,
            "patient_nom": f"{patient.prenom} {patient.nom}".strip() if patient else "Patient Inconnu",
            "patient_email": patient.email if patient else "",
            "medecin_nom": f"Dr. {medecin.prenom} {medecin.nom}".strip() if medecin else "Médecin Inconnu",
            "medecin_email": medecin.email if medecin else "",
            "motif": getattr(c, 'motif', "Consultation"),
            "motif_signalement": getattr(c, 'motif_signalement', None),
            "statut": getattr(c, 'statut', "Normal"),
            "niveau_risque": getattr(c, 'niveau_risque', "Faible"),
            "created_at": c.created_at.isoformat() if c.created_at else "",
            "last_message_at": last_msg_time.isoformat() if last_msg_time else "",
            "messages": messages_formatted,
            "admin_messages": admin_messages_formatted,
        })

    return {"conversations": result, "total": total}


@router.post("/admin/conversations/{conv_id}/message")
async def admin_send_message(
    conv_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    from models import Message
    from datetime import datetime, timezone
    
    new_msg = Message(
        conversation_id=conv_id,
        expediteur_type="admin",
        expediteur_id=current_user.id,
        contenu=payload.get("text"),
        signale=False
    )
    db.add(new_msg)
    
    conv = db.get(Conversation, conv_id)
    if conv:
        conv.last_message_at = datetime.now(timezone.utc)
        if conv.statut == "Signalé":
            conv.statut = "Résolu" # Optionnel : changer le statut après réponse admin
            
    db.commit()
    return {"message": "Message envoyé"}


@router.patch("/admin/conversations/{conv_id}/statut")
async def admin_update_conv_status(
    conv_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(404, "Conversation introuvable")
    
    nouveau_statut = payload.get("statut")
    if nouveau_statut not in ["Normal", "Signalé", "Résolu"]:
        raise HTTPException(400, "Statut invalide")
        
    conv.statut = nouveau_statut
    if nouveau_statut == "Signalé" and not getattr(conv, 'niveau_risque', None):
        conv.niveau_risque = "Moyen"
        
    db.commit()
    return {"message": "Statut mis à jour"}


@router.post("/admin/users/{user_id}/ban")
async def admin_ban_user(
    user_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Utilisateur introuvable")
    
    user.statut = "suspendu"
    # Tu peux aussi créer une entrée dans AuditLog ici pour tracer la raison
    
    db.commit()
    return {"message": f"Utilisateur {user.email} suspendu"}







from services.email_service import envoyer_email, email_medecin_valide, email_medecin_rejete
import asyncio

@router.patch("/admin/medecins/{medecin_id}/statut")
async def admin_update_medecin_statut(
    medecin_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    medecin = db.get(Medecin, medecin_id)
    user    = db.get(User,    medecin_id)
    if not medecin or not user:
        raise HTTPException(404, "Médecin introuvable")

    nouveau_statut = payload.get("statut")
    motif = payload.get("motif", "")

    if nouveau_statut in ("verifie", "rejete", "en_attente", "suspendu"):
        ancien_statut = medecin.statut_verification
        medecin.statut_verification = nouveau_statut

        if nouveau_statut != ancien_statut:
            if nouveau_statut == "verifie":
                user.statut = "actif"
                medecin.disponible_maintenant = True

                sujet = "Votre compte NERE Health a été approuvé"
                corps = email_medecin_valide(user.prenom, user.nom)
                envoyer_email(user.email, sujet, corps)

                notif = Notification(
                    utilisateur_id=user.id,
                    type="compte_valide",
                    canal="in_app",
                    statut="en_attente",
                    titre="Compte approuvé",
                    contenu="Votre compte professionnel a été vérifié et activé. Vous pouvez maintenant vous connecter.",
                )
                db.add(notif)

            elif nouveau_statut == "rejete":
                user.statut = "inactif"
                medecin.disponible_maintenant = False

                sujet = "Votre demande NERE Health nécessite des corrections"
                corps = email_medecin_rejete(user.prenom, user.nom, motif)
                envoyer_email(user.email, sujet, corps)

                notif = Notification(
                    utilisateur_id=user.id,
                    type="compte_rejete",
                    canal="in_app",
                    statut="en_attente",
                    titre="Vérification refusée",
                    contenu=motif or "Veuillez vérifier vos documents et les soumettre à nouveau.",
                )
                db.add(notif)

    if nouveau_statut in ("actif", "inactif"):
        user.statut = nouveau_statut

    db.commit()
    return {
        "message": "Statut mis à jour et email envoyé",
        "statut_verification": medecin.statut_verification,
        "statut_compte": user.statut,
    }







@router.get("/admin/notifications")
async def get_admin_notifications(
    statut: Optional[str] = None, # "non_lus" ou "lus"
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # Jointure avec User pour récupérer les notifications destinées aux admins
    stmt = (
        select(Notification)
        .join(User, Notification.utilisateur_id == User.id)
        .where(User.role == "admin")
    )
    
    # Adapté selon le champ de statut dans votre DB (ex: statut == 'lu' ou champ lu boolean)
    if statut == "non_lus":
        stmt = stmt.where(Notification.statut != "lu")
    elif statut == "lus":
        stmt = stmt.where(Notification.statut == "lu")
        
    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
    
    notifs = db.execute(
        stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    
    result = []
    for n in notifs:
        # On sécurise la lecture des attributs réels de votre modèle
        est_lu = getattr(n, 'statut', '') == "lu" or getattr(n, 'lu', False)
        
        result.append({
            "id": str(n.id),
            "titre": getattr(n, 'titre', 'Notification'),
            "message": getattr(n, 'contenu', getattr(n, 'message', '')),
            "type": getattr(n, 'type', 'info'),
            "lu": est_lu,
            "created_at": n.created_at.isoformat() if getattr(n, 'created_at', None) else None,
            "action_url": getattr(n, 'action_url', None),
        })
        
    return {"notifications": result, "total": total}


@router.patch("/admin/notifications/{notif_id}/read")
async def mark_notification_as_read(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    notif = db.get(Notification, notif_id)
    if not notif:
        raise HTTPException(404, "Notification introuvable")
    
    # Mise à jour selon votre structure (champs 'statut' ou 'lu')
    if hasattr(notif, 'statut'):
        notif.statut = "lu"
    if hasattr(notif, 'lu'):
        notif.lu = True

    db.commit()
    return {"message": "Notification marquée comme lue"}


@router.patch("/admin/notifications/read-all")
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # Récupération des IDs d'utilisateurs admins
    admin_ids = db.query(User.id).filter(User.role == "admin").all()
    admin_ids_list = [a[0] for a in admin_ids]

    if admin_ids_list:
        query = db.query(Notification).filter(Notification.utilisateur_id.in_(admin_ids_list))
        
        if hasattr(Notification, 'statut'):
            query.update({"statut": "lu"}, synchronize_session=False)
        if hasattr(Notification, 'lu'):
            query.update({"lu": True}, synchronize_session=False)

        db.commit()

    return {"message": "Toutes les notifications ont été marquées comme lues"}


@router.delete("/admin/notifications/{notif_id}")
async def delete_notification(
    notif_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    notif = db.get(Notification, notif_id)
    if not notif:
        raise HTTPException(404, "Notification introuvable")
    
    db.delete(notif)
    db.commit()
    return {"message": "Notification supprimée"}












@router.get("/admin/dashboard/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # 1. Stats globales
    total_patients = db.query(func.count(Patient.id)).scalar() or 0
    total_medecins = db.query(func.count(Medecin.id)).scalar() or 0
    total_structures = db.query(func.count(Structure.id)).scalar() or 0
    total_observers = db.query(func.count(User.id)).filter(User.role == "observateur").scalar() or 0

    stats = [
        {"title": "Patients", "value": f"{total_patients:,}".replace(",", " "), "growth": "+12%", "icon": "Users", "color": "from-blue-500 to-cyan-500"},
        {"title": "Médecins", "value": f"{total_medecins:,}".replace(",", " "), "growth": "+8%", "icon": "Stethoscope", "color": "from-emerald-500 to-green-500"},
        {"title": "Structures", "value": str(total_structures), "growth": "+5%", "icon": "Hospital", "color": "from-violet-500 to-purple-500"},
        {"title": "Observateurs", "value": str(total_observers), "growth": "+15%", "icon": "UserCheck", "color": "from-orange-500 to-amber-500"},
    ]

    # 2. Données Graphiques (Exemple simplifié, adapte les requêtes à tes besoins)
    consultations_data = [
        {"month": "Jan", "value": 400}, {"month": "Fév", "value": 700},
        {"month": "Mar", "value": 900}, {"month": "Avr", "value": 1200},
        {"month": "Mai", "value": 1600}, {"month": "Jun", "value": 1900},
    ]

    users_data = [
        {"name": "Patients", "value": total_patients},
        {"name": "Médecins", "value": total_medecins},
        {"name": "Observateurs", "value": total_observers},
        {"name": "Admins", "value": db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0},
    ]

    # 3. Alertes récentes (simulé ou tiré de la BDD)
    alerts = [
        {"title": "Tentatives de connexion suspectes", "level": "Critique", "time": "Il y a 5 min"},
        {"title": "Serveur API à 85% d'utilisation", "level": "Moyen", "time": "Il y a 18 min"},
        {"title": "Nouvelle structure en attente", "level": "Info", "time": "Il y a 30 min"},
    ]

    # 4. Notifications récentes
    recent_notifs = db.query(Notification).order_by(Notification.created_at.desc()).limit(4).all()
    notifications = [n.contenu for n in recent_notifs] or [
        "3 nouveaux médecins ont soumis leurs documents",
        "Export des patients terminé avec succès",
        "Nouvel observateur ajouté dans le système",
        "5 nouvelles consultations enregistrées"
    ]

    return {
        "stats": stats,
        "charts": {
            "consultations": consultations_data,
            "users": users_data,
            "alerts": alerts,
            "notifications": notifications,
            "exports": [
                {"name": "Patients.xlsx", "size": "2.4 MB", "status": "Disponible"},
                {"name": "Medecins.pdf", "size": "1.2 MB", "status": "Disponible"},
            ]
        }
    }