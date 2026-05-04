from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Medecin, User
from ..schemas import MedecinCreate, MedecinRead

router = APIRouter(tags=["medecins"])


@router.get("/medecins", response_model=List[MedecinRead])
async def list_medecins(
    current_user=Depends(get_current_active_user),
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
):
    if current_user.role == "medecin":
        stmt = select(Medecin).where(Medecin.id == current_user.id)
    elif current_user.role == "admin":
        stmt = select(Medecin).limit(limit)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    medecins = db.execute(stmt).scalars().all()
    return medecins


@router.post("/medecins", response_model=MedecinRead, status_code=status.HTTP_201_CREATED)
async def create_medecin(
    medecin_create: MedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.get(User, medecin_create.id)
    if not user or user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur médecin introuvable")

    medecin = Medecin(**medecin_create.dict(exclude_unset=True))
    db.add(medecin)
    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du médecin") from exc
    return medecin


@router.get("/medecins/{medecin_id}", response_model=MedecinRead)
async def read_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and medecin.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return medecin


@router.put("/medecins/{medecin_id}", response_model=MedecinRead)
async def update_medecin(
    medecin_id: UUID,
    medecin_update: MedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and medecin.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    for field, value in medecin_update.dict(exclude_unset=True).items():
        setattr(medecin, field, value)

    db.add(medecin)
    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour du médecin: {exc.orig}") from exc
    return medecin


@router.delete("/medecins/{medecin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    db.delete(medecin)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
