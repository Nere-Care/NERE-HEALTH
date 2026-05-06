from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Disponibilite, User
from ..schemas import DisponibiliteCreate, DisponibiliteRead

router = APIRouter(tags=["disponibilites"])


@router.get("/disponibilites", response_model=List[DisponibiliteRead])
async def list_disponibilites(
    medecin_id: Optional[UUID] = None,
    jour_semaine: Optional[str] = None,
    actif: Optional[bool] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    stmt = select(Disponibilite)
    if current_user.role == "medecin":
        stmt = stmt.where(Disponibilite.medecin_id == current_user.id)
    if medecin_id:
        stmt = stmt.where(Disponibilite.medecin_id == medecin_id)
    if jour_semaine:
        stmt = stmt.where(Disponibilite.jour_semaine == jour_semaine)
    if actif is not None:
        stmt = stmt.where(Disponibilite.actif == actif)

    disponibilites = db.execute(stmt.order_by(Disponibilite.date_debut_validite.desc()).limit(limit)).scalars().all()
    return disponibilites


@router.post("/disponibilites", response_model=DisponibiliteRead, status_code=status.HTTP_201_CREATED)
async def create_disponibilite(
    disponibilite_create: DisponibiliteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if current_user.role == "medecin":
        disponibilite_create.medecin_id = current_user.id
    if current_user.role == "admin" and not disponibilite_create.medecin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin requis pour la disponibilité")
    if (
        not db.get(User, disponibilite_create.medecin_id)
        or db.get(User, disponibilite_create.medecin_id).role != "medecin"
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    disponibilite = Disponibilite(**disponibilite_create.dict(exclude_unset=True))
    db.add(disponibilite)
    try:
        db.commit()
        db.refresh(disponibilite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la disponibilité"
        ) from exc
    return disponibilite


@router.get("/disponibilites/{disponibilite_id}", response_model=DisponibiliteRead)
async def read_disponibilite(
    disponibilite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return disponibilite


@router.put("/disponibilites/{disponibilite_id}", response_model=DisponibiliteRead)
async def update_disponibilite(
    disponibilite_id: UUID,
    disponibilite_update: DisponibiliteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if disponibilite_update.medecin_id and current_user.role == "admin":
        medecin = db.get(User, disponibilite_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in disponibilite_update.dict(exclude_unset=True).items():
        setattr(disponibilite, field, value)

    db.add(disponibilite)
    try:
        db.commit()
        db.refresh(disponibilite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la disponibilité: {exc.orig}"
        ) from exc
    return disponibilite


@router.delete("/disponibilites/{disponibilite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_disponibilite(
    disponibilite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(disponibilite)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
