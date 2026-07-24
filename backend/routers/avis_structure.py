from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_active_user
from db import get_db
from models import AvisStructure, Patient, Structure
from schemas import AvisStructureCreate, AvisStructureRead

router = APIRouter(tags=["avis_structure"])


@router.get("/structures/{structure_id}/avis", response_model=List[AvisStructureRead])
async def list_avis_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = (
        select(AvisStructure)
        .where(AvisStructure.structure_id == structure_id)
        .order_by(AvisStructure.created_at.desc())
    )
    avis = db.execute(stmt).scalars().all()
    return avis


@router.get("/structures/{structure_id}/avis/moyenne")
async def moyenne_avis_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(
        func.coalesce(func.avg(AvisStructure.note), 0).label("moyenne"),
        func.count(AvisStructure.id).label("total"),
    ).where(AvisStructure.structure_id == structure_id)
    row = db.execute(stmt).one()
    return {"moyenne": round(float(row.moyenne), 1), "total": row.total}


@router.post("/structures/{structure_id}/avis", response_model=AvisStructureRead, status_code=status.HTTP_201_CREATED)
async def create_avis_structure(
    structure_id: UUID,
    avis_create: AvisStructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seuls les patients peuvent donner un avis")

    if not db.get(Structure, structure_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Structure introuvable")

    patient = db.query(Patient).filter(Patient.id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    avis = AvisStructure(
        patient_id=current_user.id,
        structure_id=structure_id,
        note=avis_create.note,
        commentaire=avis_create.commentaire,
    )
    db.add(avis)
    db.commit()
    db.refresh(avis)
    return avis
