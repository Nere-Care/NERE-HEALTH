from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from db import get_db
from models import Medicament
from schemas import MedicamentRead

router = APIRouter(tags=["medicaments"])


@router.get("/medicaments", response_model=list[MedicamentRead])
async def list_medicaments(
    search: Optional[str] = Query(None, description="Recherche par nom commercial, DCI ou classe thérapeutique"),
    limit: int = Query(20, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = db.query(Medicament)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.filter(
            or_(
                Medicament.nom_commercial.ilike(pattern),
                Medicament.dci.ilike(pattern),
                Medicament.classe_therapeutique.ilike(pattern),
                Medicament.forme.ilike(pattern),
            )
        )

    stmt = stmt.order_by(Medicament.nom_commercial).offset(offset).limit(limit)
    return stmt.all()


@router.get("/medicaments/{medicament_id}", response_model=MedicamentRead)
async def read_medicament(
    medicament_id: UUID,
    db: Session = Depends(get_db),
):
    medicament = db.get(Medicament, medicament_id)
    if not medicament:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médicament non trouvé")
    return medicament
