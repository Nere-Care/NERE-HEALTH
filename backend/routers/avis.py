from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Avis, Patient, RendezVous, User
from ..schemas import AvisCreate, AvisRead

router = APIRouter(tags=["avis"])


@router.get("/avis", response_model=List[AvisRead])
async def list_avis(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    rdv_id: Optional[UUID] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Avis)
    if current_user.role == "patient":
        stmt = stmt.where(Avis.patient_id == current_user.id)
    elif current_user.role == "medecin":
        stmt = stmt.where(Avis.medecin_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(Avis.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Avis.medecin_id == medecin_id)
    if rdv_id:
        stmt = stmt.where(Avis.rdv_id == rdv_id)

    avis_list = db.execute(stmt.order_by(Avis.created_at.desc()).limit(limit)).scalars().all()
    return avis_list


@router.post("/avis", response_model=AvisRead, status_code=status.HTTP_201_CREATED)
async def create_avis(
    avis_create: AvisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        avis_create.patient_id = current_user.id
    elif current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not db.get(Patient, avis_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    medecin = db.get(User, avis_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    if not db.get(RendezVous, avis_create.rdv_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

    if avis_create.note < 1 or avis_create.note > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La note doit être comprise entre 1 et 5")

    avis = Avis(**avis_create.dict(exclude_unset=True))
    db.add(avis)
    try:
        db.commit()
        db.refresh(avis)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de l'avis") from exc
    return avis


@router.get("/avis/{avis_id}", response_model=AvisRead)
async def read_avis(
    avis_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "patient" and avis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return avis


@router.put("/avis/{avis_id}", response_model=AvisRead)
async def update_avis(
    avis_id: UUID,
    avis_update: AvisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if avis_update.note is not None and (avis_update.note < 1 or avis_update.note > 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La note doit être comprise entre 1 et 5")

    for field, value in avis_update.dict(exclude_unset=True).items():
        setattr(avis, field, value)

    db.add(avis)
    try:
        db.commit()
        db.refresh(avis)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de l'avis: {exc.orig}"
        ) from exc
    return avis


@router.delete("/avis/{avis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avis(
    avis_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(avis)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
