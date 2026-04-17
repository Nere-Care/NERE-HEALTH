from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Consultation, DocumentMedical, Patient, User
from schemas import DocumentMedicalCreate, DocumentMedicalRead

router = APIRouter(tags=["documents_medicaux"])


@router.get("/documents_medicaux", response_model=List[DocumentMedicalRead])
async def list_documents_medicaux(
    patient_id: Optional[UUID] = None,
    consultation_id: Optional[UUID] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(DocumentMedical)
    if current_user.role == "patient":
        stmt = stmt.where(DocumentMedical.patient_id == current_user.id)
    elif current_user.role == "medecin":
        stmt = stmt.where(DocumentMedical.medecin_uploadeur_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(DocumentMedical.patient_id == patient_id)
    if consultation_id:
        stmt = stmt.where(DocumentMedical.consultation_id == consultation_id)

    documents = db.execute(stmt.order_by(DocumentMedical.created_at.desc()).limit(limit)).scalars().all()
    return documents


@router.post("/documents_medicaux", response_model=DocumentMedicalRead, status_code=status.HTTP_201_CREATED)
async def create_document_medical(
    document_create: DocumentMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        document_create.patient_id = current_user.id
        document_create.uploaded_par = current_user.id
    elif current_user.role == "medecin":
        document_create.medecin_uploadeur_id = current_user.id
        document_create.uploaded_par = current_user.id
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not db.get(Patient, document_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if document_create.consultation_id and not db.get(Consultation, document_create.consultation_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation introuvable")

    document = DocumentMedical(**document_create.dict(exclude_unset=True))
    db.add(document)
    try:
        db.commit()
        db.refresh(document)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du document médical") from exc
    return document


@router.get("/documents_medicaux/{document_id}", response_model=DocumentMedicalRead)
async def read_document_medical(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    document = db.get(DocumentMedical, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document médical non trouvé")
    if current_user.role == "patient" and document.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and document.medecin_uploadeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return document


@router.put("/documents_medicaux/{document_id}", response_model=DocumentMedicalRead)
async def update_document_medical(
    document_id: UUID,
    document_update: DocumentMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    document = db.get(DocumentMedical, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document médical non trouvé")
    if current_user.role == "patient" and document.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and document.medecin_uploadeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if document_update.patient_id and not db.get(Patient, document_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    for field, value in document_update.dict(exclude_unset=True).items():
        setattr(document, field, value)

    db.add(document)
    try:
        db.commit()
        db.refresh(document)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour du document médical: {exc.orig}") from exc
    return document


@router.delete("/documents_medicaux/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document_medical(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    document = db.get(DocumentMedical, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document médical non trouvé")
    if current_user.role == "medecin" and document.medecin_uploadeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(document)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
