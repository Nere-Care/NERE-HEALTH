from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Patient
from ..schemas import PatientCreate, PatientRead

router = APIRouter(tags=["patients"])


@router.get("/patients", response_model=List[PatientRead])
async def read_patients(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patients = db.query(Patient).limit(limit).all()
    return patients


@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_create: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = Patient(**patient_create.dict())
    db.add(patient)
    try:
        db.commit()
        db.refresh(patient)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création du patient"
        if "uq_patients_numero_patient" in str(exc.orig):
            detail = "Ce numéro de patient est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return patient


@router.get("/patients/{patient_id}", response_model=PatientRead)
async def read_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")
    return patient
