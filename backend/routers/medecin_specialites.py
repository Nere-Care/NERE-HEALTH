from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import MedecinSpecialite, User
from ..schemas import MedecinSpecialiteCreate, MedecinSpecialiteRead

router = APIRouter(tags=["medecin_specialites"])


@router.get("/medecin_specialites", response_model=List[MedecinSpecialiteRead])
async def list_medecin_specialites(
    medecin_id: Optional[UUID] = None,
    specialite_id: Optional[UUID] = None,
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "medecin":
        stmt = select(MedecinSpecialite).where(MedecinSpecialite.medecin_id == current_user.id)
    elif current_user.role == "admin":
        stmt = select(MedecinSpecialite)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if medecin_id:
        stmt = stmt.where(MedecinSpecialite.medecin_id == medecin_id)
    if specialite_id:
        stmt = stmt.where(MedecinSpecialite.specialite_id == specialite_id)

    specialites = db.execute(stmt.limit(limit)).scalars().all()
    return specialites


@router.post("/medecin_specialites", response_model=MedecinSpecialiteRead, status_code=status.HTTP_201_CREATED)
async def create_medecin_specialite(
    specialite_create: MedecinSpecialiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(User, specialite_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    medecin_specialite = MedecinSpecialite(**specialite_create.dict(exclude_unset=True))
    db.add(medecin_specialite)
    try:
        db.commit()
        db.refresh(medecin_specialite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la spécialité du médecin") from exc
    return medecin_specialite


@router.get("/medecin_specialites/{medecin_id}/{specialite_id}", response_model=MedecinSpecialiteRead)
async def read_medecin_specialite(
    medecin_id: UUID,
    specialite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(MedecinSpecialite).where(
        MedecinSpecialite.medecin_id == medecin_id,
        MedecinSpecialite.specialite_id == specialite_id,
    )
    medecin_specialite = db.execute(stmt).scalar_one_or_none()
    if not medecin_specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité médecin non trouvée")
    if current_user.role == "medecin" and medecin_specialite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return medecin_specialite


@router.put("/medecin_specialites/{medecin_id}/{specialite_id}", response_model=MedecinSpecialiteRead)
async def update_medecin_specialite(
    medecin_id: UUID,
    specialite_id: UUID,
    specialite_update: MedecinSpecialiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    stmt = select(MedecinSpecialite).where(
        MedecinSpecialite.medecin_id == medecin_id,
        MedecinSpecialite.specialite_id == specialite_id,
    )
    medecin_specialite = db.execute(stmt).scalar_one_or_none()
    if not medecin_specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité médecin non trouvée")

    for field, value in specialite_update.dict(exclude_unset=True).items():
        setattr(medecin_specialite, field, value)

    db.add(medecin_specialite)
    try:
        db.commit()
        db.refresh(medecin_specialite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la spécialité: {exc.orig}") from exc
    return medecin_specialite


@router.delete("/medecin_specialites/{medecin_id}/{specialite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medecin_specialite(
    medecin_id: UUID,
    specialite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    stmt = select(MedecinSpecialite).where(
        MedecinSpecialite.medecin_id == medecin_id,
        MedecinSpecialite.specialite_id == specialite_id,
    )
    medecin_specialite = db.execute(stmt).scalar_one_or_none()
    if not medecin_specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité médecin non trouvée")
    db.delete(medecin_specialite)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
