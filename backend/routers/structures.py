from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Structure
from ..schemas import StructureCreate, StructureRead

router = APIRouter(tags=["structures"])


@router.get("/structures", response_model=list[StructureRead])
async def list_structures(
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Structure).limit(limit)
    structures = db.execute(stmt).scalars().all()
    return structures


@router.post("/structures", response_model=StructureRead, status_code=status.HTTP_201_CREATED)
async def create_structure(
    structure_create: StructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if not structure_create.id:
        structure_create.id = uuid4()

    structure = Structure(**structure_create.dict(exclude_unset=True))
    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la structure") from exc
    return structure


@router.get("/structures/{structure_id}", response_model=StructureRead)
async def read_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    return structure


@router.put("/structures/{structure_id}", response_model=StructureRead)
async def update_structure(
    structure_id: UUID,
    structure_update: StructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    for field, value in structure_update.dict(exclude_unset=True).items():
        setattr(structure, field, value)

    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la structure: {exc.orig}") from exc
    return structure


@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    db.delete(structure)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
