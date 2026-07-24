import os
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import MiseAJour
from schemas import MiseAJourCreate, MiseAJourRead, MiseAJourUpdate

router = APIRouter(tags=["mises_a_jour"])


@router.get("/mises_a_jour", response_model=List[MiseAJourRead])
async def list_mises_a_jour(
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = db.query(MiseAJour).order_by(MiseAJour.created_at.desc())
    if current_user.role == "admin":
        pass
    elif current_user.role == "medecin":
        stmt = stmt.filter(MiseAJour.est_visible_medecin == True)
    else:
        stmt = stmt.filter(MiseAJour.est_active == True)
    return stmt.limit(limit).all()


@router.get("/mises_a_jour/{mise_id}", response_model=MiseAJourRead)
async def read_mise_a_jour(
    mise_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    item = db.get(MiseAJour, mise_id)
    if not item:
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")
    if not item.est_active and current_user.role not in ("admin",):
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")
    return item


@router.post("/mises_a_jour", response_model=MiseAJourRead, status_code=status.HTTP_201_CREATED)
async def create_mise_a_jour(
    data: MiseAJourCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = MiseAJour(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/mises_a_jour/{mise_id}", response_model=MiseAJourRead)
async def update_mise_a_jour(
    mise_id,
    data: MiseAJourUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = db.get(MiseAJour, mise_id)
    if not item:
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/mises_a_jour/{mise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mise_a_jour(
    mise_id,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = db.get(MiseAJour, mise_id)
    if not item:
        raise HTTPException(status_code=404, detail="Mise à jour introuvable")
    db.delete(item)
    db.commit()
