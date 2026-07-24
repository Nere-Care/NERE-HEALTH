from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_active_user
from db import get_db
from models import Medecin, Patient, ProfessionnelAutorise, RendezVous, User
from schemas import ProfessionnelAutoriseCreate, ProfessionnelAutoriseRead, MedecinRead

router = APIRouter(tags=["confidentialite"])


@router.get("/confidentialite/professionnels-autorises", response_model=list[ProfessionnelAutoriseRead])
async def list_professionnels_autorises(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient non trouvé")

    stmt = select(ProfessionnelAutorise).where(ProfessionnelAutorise.patient_id == current_user.id)
    autorisations = db.execute(stmt).scalars().all()

    result = []
    for auth in autorisations:
        user = db.get(User, auth.medecin_id)
        read = ProfessionnelAutoriseRead.model_validate(auth)
        if user:
            read.medecin_nom = user.nom
            read.medecin_prenom = user.prenom
        result.append(read)
    return result


@router.post("/confidentialite/professionnels-autorises", response_model=ProfessionnelAutoriseRead, status_code=201)
async def add_professionnel_autorise(
    body: ProfessionnelAutoriseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient non trouvé")

    existing = db.execute(
        select(ProfessionnelAutorise).where(
            ProfessionnelAutorise.patient_id == current_user.id,
            ProfessionnelAutorise.medecin_id == body.medecin_id,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Ce professionnel est déjà autorisé")

    medecin_user = db.get(User, body.medecin_id)
    if not medecin_user or medecin_user.role != "medecin":
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    autorisation = ProfessionnelAutorise(
        patient_id=current_user.id,
        medecin_id=body.medecin_id,
    )
    db.add(autorisation)
    db.commit()
    db.refresh(autorisation)

    read = ProfessionnelAutoriseRead.model_validate(autorisation)
    read.medecin_nom = medecin_user.nom
    read.medecin_prenom = medecin_user.prenom
    return read


@router.delete("/confidentialite/professionnels-autorises/{medecin_id}", status_code=204)
async def remove_professionnel_autorise(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient non trouvé")

    autorisation = db.execute(
        select(ProfessionnelAutorise).where(
            ProfessionnelAutorise.patient_id == current_user.id,
            ProfessionnelAutorise.medecin_id == medecin_id,
        )
    ).scalar_one_or_none()
    if not autorisation:
        raise HTTPException(status_code=404, detail="Autorisation non trouvée")

    db.delete(autorisation)
    db.commit()


@router.get("/confidentialite/medecins-rdv-history", response_model=List[MedecinRead])
async def list_medecins_rdv_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient non trouvé")

    rdv_stmt = (
        select(RendezVous.medecin_id)
        .where(RendezVous.patient_id == current_user.id)
        .distinct()
    )
    medecin_ids = [row[0] for row in db.execute(rdv_stmt).all()]

    if not medecin_ids:
        return []

    results = []
    for mid in medecin_ids:
        medecin = db.get(Medecin, mid)
        if not medecin:
            continue
        user = db.get(User, mid)
        if not user:
            continue
        medecin_data = {c.key: getattr(medecin, c.key) for c in medecin.__table__.columns}
        medecin_data["prenom"] = user.prenom
        medecin_data["nom"] = user.nom
        medecin_data["email"] = user.email
        medecin_data["telephone"] = user.telephone
        medecin_data["photo_url"] = user.photo_url
        results.append(medecin_data)
    return results
