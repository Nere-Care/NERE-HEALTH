from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import DossierMedical, Patient, User
from schemas import DossierMedicalCreate, DossierMedicalRead

router = APIRouter(tags=["dossiers_medicaux"])


@router.get("/dossiers_medicaux", response_model=List[DossierMedicalRead])
async def list_dossiers_medicaux(
    medecin_traitant_id: UUID | None = None,
    patient_id: UUID | None = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(DossierMedical)
    if current_user.role == "medecin":
        stmt = stmt.where(DossierMedical.medecin_traitant_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if medecin_traitant_id:
        stmt = stmt.where(DossierMedical.medecin_traitant_id == medecin_traitant_id)
    if patient_id:
        stmt = stmt.where(DossierMedical.patient_id == patient_id)

    stmt = stmt.order_by(DossierMedical.created_at.desc()).limit(limit)
    dossiers = db.execute(stmt).scalars().all()
    return dossiers


@router.post("/dossiers_medicaux", response_model=DossierMedicalRead, status_code=status.HTTP_201_CREATED)
async def create_dossier_medical(
    dossier_create: DossierMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(Patient, dossier_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if current_user.role == "medecin":
        dossier_create.medecin_traitant_id = current_user.id
    elif dossier_create.medecin_traitant_id:
        medecin = db.get(User, dossier_create.medecin_traitant_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    dossier = DossierMedical(**dossier_create.dict(exclude_unset=True))
    db.add(dossier)
    try:
        db.commit()
        db.refresh(dossier)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de dossier médical"
        if "uq_dossiers_medicaux_numero_dossier" in str(exc.orig):
            detail = "Ce numéro de dossier médical est déjà utilisé"
        elif "uq_dossiers_medicaux_patient_id" in str(exc.orig):
            detail = "Un dossier médical existe déjà pour ce patient"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return dossier


@router.get("/dossiers_medicaux/{dossier_id}", response_model=DossierMedicalRead)
async def read_dossier_medical(
    dossier_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if current_user.role == "medecin" and dossier.medecin_traitant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return dossier


@router.put("/dossiers_medicaux/{dossier_id}", response_model=DossierMedicalRead)
async def update_dossier_medical(
    dossier_id: UUID,
    dossier_update: DossierMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if current_user.role == "medecin" and dossier.medecin_traitant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if dossier_update.patient_id and not db.get(Patient, dossier_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if dossier_update.medecin_traitant_id and current_user.role == "admin":
        medecin = db.get(User, dossier_update.medecin_traitant_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in dossier_update.dict(exclude_unset=True).items():
        setattr(dossier, field, value)

    db.add(dossier)
    try:
        db.commit()
        db.refresh(dossier)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de dossier médical: {exc.orig}") from exc
    return dossier


@router.delete("/dossiers_medicaux/{dossier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dossier_medical(
    dossier_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if current_user.role == "medecin" and dossier.medecin_traitant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(dossier)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
