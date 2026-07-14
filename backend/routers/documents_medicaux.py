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

import os
import uuid
import hashlib
from pathlib import Path
from fastapi import UploadFile, File, Form
from datetime import date

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



@router.get("/mes-documents-medicaux")
async def mes_documents(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    from models import DocumentMedical
    from sqlalchemy import select
    docs = db.execute(
        select(DocumentMedical)
        .where(DocumentMedical.patient_id == current_user.id)
        .where(DocumentMedical.visible_patient == True)
        .order_by(DocumentMedical.created_at.desc())
    ).scalars().all()

    return [
        {
            "id": str(d.id),
            "nom_fichier_original": d.nom_fichier_original,
            "type_document": d.type_document,
            "mime_type": d.mime_type,
            "taille_octets": d.taille_octets,
            "url_stockage": d.url_stockage,
            "date_document": d.date_document.isoformat() if d.date_document else None,
            "description": d.description or "",
        }
        for d in docs
    ]


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








# Dossier de stockage
UPLOAD_DIR = Path("/app/uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mapping des types acceptés
TYPES_DOCUMENT_VALIDES = [
    "resultat_labo",
    "imagerie_radio",
    "imagerie_echographie",
    "imagerie_scanner",
    "imagerie_irm",
    "compte_rendu_consultation",
    "ordonnance_scannee",
    "certificat_medical",
    "carnet_vaccination",
]

# Taille max : 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
# Types MIME autorisés
ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
]


@router.post("/documents-medicaux/upload")
async def upload_document_medical(
    file: UploadFile = File(...),
    type_document: str = Form("resultat_labo"),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Upload un document médical pour le patient connecté."""
    
    # 1. Vérifier le rôle
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Réservé aux patients")
    
    # 2. Valider le type de document
    if type_document not in TYPES_DOCUMENT_VALIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Type invalide. Valeurs acceptées: {', '.join(TYPES_DOCUMENT_VALIDES)}"
        )
    
    # 3. Valider le type MIME
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé: {file.content_type}. Acceptés: PDF, JPG, PNG"
        )
    
    # 4. Lire le contenu et vérifier la taille
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Maximum: {MAX_FILE_SIZE // (1024*1024)} MB"
        )
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")
    
    # 5. Générer un nom unique
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        ext = ".pdf"
    
    nom_stockage = f"{uuid.uuid4().hex}{ext}"
    chemin_fichier = UPLOAD_DIR / nom_stockage
    
    # 6. Sauvegarder le fichier sur le disque
    try:
        with open(chemin_fichier, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier: {e}")
    
    # 7. Calculer le checksum SHA256
    checksum = hashlib.sha256(content).hexdigest()
    
    # 8. Créer l'entrée en base
    document = DocumentMedical(
        patient_id=current_user.id,
        uploaded_par=current_user.id,
        type_document=type_document,
        nom_fichier_original=file.filename,
        nom_fichier_stockage=nom_stockage,
        url_stockage=f"/uploads/documents/{nom_stockage}",
        checksum_sha256=checksum,
        taille_octets=len(content),
        mime_type=file.content_type,
        est_chiffre=False,
        visible_patient=True,
        partage_avec_medecins=[],
        description=description,
        date_document=date.today(),
    )
    
    db.add(document)
    
    try:
        db.commit()
        db.refresh(document)
    except Exception as e:
        db.rollback()
        # Supprimer le fichier si erreur BDD
        if chemin_fichier.exists():
            chemin_fichier.unlink()
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {e}")
    
    return {
        "id": str(document.id),
        "nom_fichier_original": document.nom_fichier_original,
        "type_document": document.type_document,
        "mime_type": document.mime_type,
        "taille_octets": document.taille_octets,
        "url_stockage": document.url_stockage,
        "date_document": document.date_document.isoformat() if document.date_document else None,
        "message": "Document uploadé avec succès",
    }





@router.post("/mes-documents-medicaux")
async def upload_mes_documents(
    file: UploadFile = File(...),
    type_document: str = Form("resultat_labo"),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Alias POST pour l'upload de document médical du patient connecté.
    Réutilise la même logique que /documents-medicaux/upload."""

    # 1. Vérifier le rôle
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Réservé aux patients")

    # 2. Valider le type de document
    if type_document not in TYPES_DOCUMENT_VALIDES:
        raise HTTPException(
            status_code=400,
            detail=f"Type invalide. Valeurs acceptées: {', '.join(TYPES_DOCUMENT_VALIDES)}"
        )

    # 3. Valider le type MIME
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé: {file.content_type}. Acceptés: PDF, JPG, PNG"
        )

    # 4. Lire le contenu et vérifier la taille
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Maximum: {MAX_FILE_SIZE // (1024*1024)} MB"
        )
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    # 5. Générer un nom unique
    ext = Path(file.filename).suffix.lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        ext = ".pdf"
    nom_stockage = f"{uuid.uuid4().hex}{ext}"
    chemin_fichier = UPLOAD_DIR / nom_stockage

    # 6. Sauvegarder le fichier sur le disque
    try:
        with open(chemin_fichier, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier: {e}")

    # 7. Checksum
    checksum = hashlib.sha256(content).hexdigest()

    # 8. Créer l'entrée en base
    document = DocumentMedical(
        patient_id=current_user.id,
        uploaded_par=current_user.id,
        type_document=type_document,
        nom_fichier_original=file.filename,
        nom_fichier_stockage=nom_stockage,
        url_stockage=f"/uploads/documents/{nom_stockage}",
        checksum_sha256=checksum,
        taille_octets=len(content),
        mime_type=file.content_type,
        est_chiffre=False,
        visible_patient=True,
        partage_avec_medecins=[],
        description=description,
        date_document=date.today(),
    )
    db.add(document)

    try:
        db.commit()
        db.refresh(document)
    except Exception as e:
        db.rollback()
        if chemin_fichier.exists():
            chemin_fichier.unlink()
        raise HTTPException(status_code=500, detail=f"Erreur BDD: {e}")

    return {
        "id": str(document.id),
        "nom_fichier_original": document.nom_fichier_original,
        "type_document": document.type_document,
        "mime_type": document.mime_type,
        "taille_octets": document.taille_octets,
        "url_stockage": document.url_stockage,
        "date_document": document.date_document.isoformat() if document.date_document else None,
        "message": "Document uploadé avec succès",
    }