from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Specialite
from ..schemas import SpecialiteCreate, SpecialiteRead

router = APIRouter(tags=["specialites"])


@router.get("/specialites", response_model=List[SpecialiteRead])
async def list_specialites(
    limit: int = Query(100, gt=0, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Specialite).limit(limit)
    specialites = db.execute(stmt).scalars().all()
    return specialites


@router.post("/specialites", response_model=SpecialiteRead, status_code=status.HTTP_201_CREATED)
async def create_specialite(
    specialite_create: SpecialiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    specialite = Specialite(**specialite_create.dict(exclude_unset=True))
    db.add(specialite)
    try:
        db.commit()
        db.refresh(specialite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la spécialité") from exc
    return specialite


@router.get("/specialites/{specialite_id}", response_model=SpecialiteRead)
async def read_specialite(
    specialite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    specialite = db.get(Specialite, specialite_id)
    if not specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité non trouvée")
    return specialite


@router.put("/specialites/{specialite_id}", response_model=SpecialiteRead)
async def update_specialite(
    specialite_id: UUID,
    specialite_update: SpecialiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    specialite = db.get(Specialite, specialite_id)
    if not specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité non trouvée")

    for field, value in specialite_update.dict(exclude_unset=True).items():
        setattr(specialite, field, value)

    db.add(specialite)
    try:
        db.commit()
        db.refresh(specialite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la spécialité: {exc.orig}") from exc
    return specialite


@router.delete("/specialites/{specialite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialite(
    specialite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    specialite = db.get(Specialite, specialite_id)
    if not specialite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Spécialité non trouvée")
    db.delete(specialite)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
