from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Actualite
from schemas import ActualiteCreate, ActualiteRead, ActualiteUpdate

router = APIRouter(tags=["actualites"])


@router.get("/actualites", response_model=List[ActualiteRead])
async def list_actualites(
    limit: int = Query(20, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = db.query(Actualite).order_by(Actualite.ordre.asc(), Actualite.created_at.desc())
    if current_user.role not in ("admin",):
        stmt = stmt.filter(Actualite.est_active == True)
    return stmt.limit(limit).all()


@router.get("/actualites/{actualite_id}", response_model=ActualiteRead)
async def read_actualite(
    actualite_id,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    item = db.get(Actualite, actualite_id)
    if not item:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    if not item.est_active and current_user.role not in ("admin",):
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    return item


@router.post("/actualites", response_model=ActualiteRead, status_code=status.HTTP_201_CREATED)
async def create_actualite(
    data: ActualiteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = Actualite(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/actualites/{actualite_id}", response_model=ActualiteRead)
async def update_actualite(
    actualite_id,
    data: ActualiteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = db.get(Actualite, actualite_id)
    if not item:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/actualites/{actualite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_actualite(
    actualite_id,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    item = db.get(Actualite, actualite_id)
    if not item:
        raise HTTPException(status_code=404, detail="Actualité introuvable")
    db.delete(item)
    db.commit()
