from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from datetime import datetime, timezone, date, timedelta

from auth import get_current_active_user
from db import get_db
from models import User, Patient, RendezVous, DossierMedical, AuditLog

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

    age = None
    if patient.date_naissance:
        today = date.today()
        age = today.year - patient.date_naissance.year - (
            (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
        )

    return {
        "id": str(user.id),
        "nom": user.nom or "",
        "prenom": user.prenom or "",
        "email": user.email or "",
        "telephone": user.telephone or "",
        "statut": user.statut or "actif",
        "numero_patient": patient.numero_patient or "",
        "sexe": patient.sexe or "",
        "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
        "age": age,
        "groupe_sanguin": patient.groupe_sanguin or "",
        "ville": patient.ville or "",
        "pays": patient.pays or "CM",
        "allergies": patient.allergies or [],
        "antecedents_medicaux": patient.antecedents_medicaux or "",
        "couverture_assurance": patient.couverture_assurance or "",
        "contact_urgence_nom": patient.contact_urgence_nom or "",
        "contact_urgence_tel": patient.contact_urgence_tel or "",
        "dossier": {
            "antecedents_familiaux": dossier.antecedents_familiaux if dossier else "",
            "antecedents_personnels": dossier.antecedents_personnels if dossier else "",
            "habitudes_vie": dossier.habitudes_vie if dossier else {},
            "vaccinations": dossier.vaccinations if dossier else [],
        } if dossier else None,
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

    if "statut" in payload:
        if payload["statut"] not in ("actif", "inactif", "suspendu"):
            raise HTTPException(400, "Statut invalide")
        user.statut = payload["statut"]
    if "telephone" in payload:
        user.telephone = payload["telephone"]
    if "groupe_sanguin" in payload:
        patient.groupe_sanguin = payload["groupe_sanguin"]
    if "allergies" in payload:
        patient.allergies = payload["allergies"]

    db.commit()
    return {"message": "Patient mis à jour"}


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