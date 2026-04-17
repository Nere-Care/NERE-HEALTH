from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Consultation, Patient, User
from schemas import ConsultationCreate, ConsultationRead

router = APIRouter(tags=["consultations"])


@router.get("/consultations", response_model=List[ConsultationRead])
async def list_consultations(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Consultation)
    if patient_id:
        stmt = stmt.where(Consultation.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Consultation.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Consultation.statut == statut)
    stmt = stmt.order_by(Consultation.date_heure_debut.desc()).limit(limit)
    consultations = db.execute(stmt).scalars().all()
    return consultations


@router.post("/consultations", response_model=ConsultationRead, status_code=status.HTTP_201_CREATED)
async def create_consultation(
    consultation_create: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(Patient, consultation_create.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    payload = consultation_create.dict()
    if current_user.role == "medecin":
        payload["medecin_id"] = current_user.id

    consultation = Consultation(**payload)
    db.add(consultation)
    try:
        db.commit()
        db.refresh(consultation)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de consultation"
        if "uq_consultations_numero_consultation" in str(exc.orig):
            detail = "Ce numéro de consultation est déjà utilisé"
        elif "uq_consultations_rdv_id" in str(exc.orig):
            detail = "Ce rendez-vous est déjà lié à une consultation"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return consultation


@router.get("/consultations/{consultation_id}", response_model=ConsultationRead)
async def read_consultation(
    consultation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    consultation = db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation non trouvée")

    if current_user.role == "medecin" and consultation.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return consultation


@router.put("/consultations/{consultation_id}", response_model=ConsultationRead)
async def update_consultation(
    consultation_id: UUID,
    consultation_update: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    consultation = db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation non trouvée")

    if current_user.role == "medecin" and consultation.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if consultation_update.patient_id:
        patient = db.get(Patient, consultation_update.patient_id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if consultation_update.medecin_id and current_user.role == "admin":
        medecin = db.get(User, consultation_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in consultation_update.dict(exclude_unset=True).items():
        if current_user.role == "medecin" and field == "medecin_id":
            continue
        setattr(consultation, field, value)

    consultation.updated_at = datetime.utcnow()
    db.add(consultation)
    try:
        db.commit()
        db.refresh(consultation)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de consultation: {exc.orig}") from exc
    return consultation


@router.delete("/consultations/{consultation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consultation(
    consultation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    consultation = db.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation non trouvée")

    if current_user.role == "medecin" and consultation.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(consultation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
