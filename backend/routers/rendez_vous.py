from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Patient, RendezVous, User
from ..schemas import RendezVousCreate, RendezVousRead

router = APIRouter(tags=["rendez_vous"])


@router.get("/rendez_vous", response_model=List[RendezVousRead])
async def list_rendez_vous(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(RendezVous)
    if current_user.role == "medecin":
        stmt = stmt.where(RendezVous.medecin_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(RendezVous.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(RendezVous.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(RendezVous.statut == statut)

    stmt = stmt.order_by(RendezVous.date_heure_debut.desc()).limit(limit)
    rendez_vous = db.execute(stmt).scalars().all()
    return rendez_vous


@router.post("/rendez_vous", response_model=RendezVousRead, status_code=status.HTTP_201_CREATED)
async def create_rendez_vous(
    rendez_vous_create: RendezVousCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(Patient, rendez_vous_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if current_user.role == "medecin":
        rendez_vous_create.medecin_id = current_user.id
    else:
        medecin = db.get(User, rendez_vous_create.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    rendez_vous = RendezVous(**rendez_vous_create.dict(exclude_unset=True))
    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de rendez-vous"
        if "uq_rendez_vous_numero_rdv" in str(exc.orig):
            detail = "Ce numéro de rendez-vous est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc

    return rendez_vous


@router.get("/rendez_vous/{rendez_vous_id}", response_model=RendezVousRead)
async def read_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return rendez_vous


@router.put("/rendez_vous/{rendez_vous_id}", response_model=RendezVousRead)
async def update_rendez_vous(
    rendez_vous_id: UUID,
    rendez_vous_update: RendezVousCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if rendez_vous_update.patient_id and not db.get(Patient, rendez_vous_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if rendez_vous_update.medecin_id and current_user.role == "admin":
        medecin = db.get(User, rendez_vous_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in rendez_vous_update.dict(exclude_unset=True).items():
        setattr(rendez_vous, field, value)

    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de rendez-vous: {exc.orig}") from exc

    return rendez_vous


@router.delete("/rendez_vous/{rendez_vous_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(rendez_vous)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
