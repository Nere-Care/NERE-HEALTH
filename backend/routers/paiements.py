from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Paiement, User
from schemas import PaiementCreate, PaiementRead

router = APIRouter(tags=["paiements"])


@router.get("/paiements", response_model=List[PaiementRead])
async def list_paiements(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Paiement)
    if patient_id:
        stmt = stmt.where(Paiement.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Paiement.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Paiement.statut == statut)
    if current_user.role != "admin":
        stmt = stmt.where(
            (Paiement.medecin_id == current_user.id) | (Paiement.patient_id == current_user.id)
        )
    stmt = stmt.order_by(Paiement.created_at.desc()).limit(limit)
    paiements = db.execute(stmt).scalars().all()
    return paiements


@router.post("/paiements", response_model=PaiementRead, status_code=status.HTTP_201_CREATED)
async def create_paiement(
    paiement_create: PaiementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(User, paiement_create.patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    medecin = db.get(User, paiement_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    paiement = Paiement(**paiement_create.dict(exclude_unset=True))
    db.add(paiement)
    try:
        db.commit()
        db.refresh(paiement)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création du paiement"
        if "uq_paiements_reference" in str(exc.orig):
            detail = "Cette référence de paiement est déjà utilisée"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return paiement


@router.get("/paiements/{paiement_id}", response_model=PaiementRead)
async def read_paiement(
    paiement_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    paiement = db.get(Paiement, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    if current_user.role != "admin" and current_user.id not in (paiement.medecin_id, paiement.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return paiement
