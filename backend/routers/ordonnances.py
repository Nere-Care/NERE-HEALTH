from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Consultation, Ordonnance, OrdonnanceLigne, Patient, User
from schemas import OrdonnanceCreate, OrdonnanceRead

router = APIRouter(tags=["ordonnances"])


@router.get("/ordonnances", response_model=List[OrdonnanceRead])
async def list_ordonnances(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Ordonnance)
    if patient_id:
        stmt = stmt.where(Ordonnance.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Ordonnance.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Ordonnance.statut == statut)
    if current_user.role != "admin":
        stmt = stmt.where(
            (Ordonnance.medecin_id == current_user.id) | (Ordonnance.patient_id == current_user.id)
        )
    stmt = stmt.order_by(Ordonnance.date_emission.desc()).limit(limit)
    ordonnances = db.execute(stmt).scalars().all()
    return ordonnances


@router.post("/ordonnances", response_model=OrdonnanceRead, status_code=status.HTTP_201_CREATED)
async def create_ordonnance(
    ordonnance_create: OrdonnanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(Patient, ordonnance_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if not db.get(Consultation, ordonnance_create.consultation_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation introuvable")
    medecin = db.get(User, ordonnance_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    ordonnance = Ordonnance(
        **{k: v for k, v in ordonnance_create.dict(exclude={"lignes"}).items() if v is not None}
    )
    db.add(ordonnance)
    db.flush()

    for ligne_data in ordonnance_create.lignes or []:
        ligne = OrdonnanceLigne(
            ordonnance_id=ordonnance.id,
            **ligne_data.dict(exclude_unset=True),
        )
        db.add(ligne)

    try:
        db.commit()
        db.refresh(ordonnance)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création d'ordonnance"
        if "uq_ordonnances_numero" in str(exc.orig):
            detail = "Ce numéro d'ordonnance est déjà utilisé"
        elif "uq_ordonnances_code_pharmacie" in str(exc.orig):
            detail = "Ce code pharmacie est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return ordonnance


@router.get("/ordonnances/{ordonnance_id}", response_model=OrdonnanceRead)
async def read_ordonnance(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return ordonnance
