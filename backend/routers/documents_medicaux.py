from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from access_control import get_dossier_access_level
from db import get_db
from models import Consultation, DocumentMedical, Medecin, Notification, Patient, Structure, User
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
    elif current_user.role in ("medecin", "infirmier", "sage_femme"):
        if patient_id:
            access = get_dossier_access_level(db, current_user, patient_id)
            if access == "restricted":
                stmt = stmt.where(
                    DocumentMedical.patient_id == patient_id,
                    DocumentMedical.medecin_uploadeur_id == current_user.id,
                )
            else:
                stmt = stmt.where(DocumentMedical.patient_id == patient_id)
        else:
            stmt = stmt.where(DocumentMedical.medecin_uploadeur_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if consultation_id:
        stmt = stmt.where(DocumentMedical.consultation_id == consultation_id)

    documents = db.execute(stmt.order_by(DocumentMedical.created_at.desc()).limit(limit)).scalars().all()

    # Enrich doctor-uploaded documents with the real structure name, address and prescriber
    uploader_ids = {
        d.medecin_uploadeur_id or d.uploaded_par
        for d in documents
        if d.medecin_uploadeur_id or d.uploaded_par
    }
    if uploader_ids:
        users = {u.id: u for u in db.execute(select(User).where(User.id.in_(uploader_ids))).scalars().all()}
        # Load Medecin rows for doctors so we can get structure_id
        medecins = {m.id: m for m in db.execute(select(Medecin).where(Medecin.id.in_(uploader_ids))).scalars().all()}
        # Load all structures referenced by those doctors
        structure_ids = {m.structure_id for m in medecins.values() if m.structure_id}
        structures = {}
        if structure_ids:
            structures = {s.id: s for s in db.execute(select(Structure).where(Structure.id.in_(structure_ids))).scalars().all()}

        for d in documents:
            uid = d.medecin_uploadeur_id or d.uploaded_par
            u = users.get(uid)
            if u and u.role == "medecin":
                med_name = f"Dr. {u.prenom or ''} {u.nom or ''}".strip()
                if not d.prescripteur_nom:
                    d.prescripteur_nom = med_name
                # Use the real structure if one exists, otherwise fall back to doctor address
                med_obj = medecins.get(uid)
                if not d.laboratoire_nom:
                    if med_obj and med_obj.structure_id:
                        struct = structures.get(med_obj.structure_id)
                        d.laboratoire_nom = struct.nom_etablissement if struct else f"Cabinet {med_name}"
                    else:
                        d.laboratoire_nom = f"Cabinet {med_name}"
                if not d.adresse_structure:
                    if med_obj and med_obj.structure_id:
                        struct = structures.get(med_obj.structure_id)
                        d.adresse_structure = (struct.adresse or struct.ville or u.adresse or "Cabinet Médical") if struct else (u.adresse or "Cabinet Médical")
                    else:
                        d.adresse_structure = u.adresse or "Cabinet Médical"

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
        med_name = f"Dr. {current_user.prenom or ''} {current_user.nom or ''}".strip()
        if not document_create.prescripteur_nom:
            document_create.prescripteur_nom = med_name
        # Look up the doctor's real structure from the Medecin table
        med_obj = db.get(Medecin, current_user.id)
        if not document_create.laboratoire_nom:
            if med_obj and med_obj.structure_id:
                struct = db.get(Structure, med_obj.structure_id)
                document_create.laboratoire_nom = struct.nom_etablissement if struct else f"Cabinet {med_name}"
            else:
                document_create.laboratoire_nom = f"Cabinet {med_name}"
        if not document_create.adresse_structure:
            if med_obj and med_obj.structure_id:
                struct = db.get(Structure, med_obj.structure_id)
                document_create.adresse_structure = (struct.adresse or struct.ville or current_user.adresse or "Cabinet Médical") if struct else (current_user.adresse or "Cabinet Médical")
            else:
                document_create.adresse_structure = current_user.adresse or "Cabinet Médical"
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

    if current_user.role == "medecin" and document_create.patient_id:
        _create_document_notification(db, document, current_user, document_create.patient_id)

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
    if current_user.role == "patient":
        if document.patient_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        if document.medecin_uploadeur_id or (document.uploaded_par and document.uploaded_par != current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Les documents envoyés par un médecin ne peuvent pas être modifiés par le patient")
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
    current_user=Depends(get_current_active_user),
):
    document = db.get(DocumentMedical, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document médical non trouvé")

    if current_user.role == "patient":
        if document.patient_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        if document.medecin_uploadeur_id or (document.uploaded_par and document.uploaded_par != current_user.id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Les documents envoyés par un médecin ne peuvent pas être supprimés par le patient")
    elif current_user.role == "medecin":
        if document.medecin_uploadeur_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    db.delete(document)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


DOCUMENT_TYPE_LABELS = {
    "resultat_labo": "Résultats d'analyse biologique",
    "imagerie_radio": "Radiographie",
    "imagerie_echographie": "Échographie",
    "imagerie_scanner": "Scanner",
    "imagerie_irm": "IRM",
    "mammographie": "Mammographie",
    "ordonnance_scannee": "Ordonnance de médicaments",
    "ordonnance_biologie": "Ordonnance de biologie",
    "compte_rendu_consultation": "Compte rendu de consultation",
    "certificat_medical": "Certificat médical",
    "carnet_vaccination": "Carnet de vaccination",
}


def _create_document_notification(db, document, medecin_user, patient_id):
    try:
        patient_user = db.get(User, patient_id)
        if not patient_user:
            return

        medecin_name = f"{medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() or "votre médecin"
        doc_type_label = DOCUMENT_TYPE_LABELS.get(document.type_document, document.type_document)
        doc_name = document.nom_fichier_original or doc_type_label

        notification = Notification(
            utilisateur_id=patient_id,
            type="document_ajoute",
            canal="in_app",
            statut="en_attente",
            titre="Nouveau document médical",
            contenu=f"Dr. {medecin_name} a ajouté un document « {doc_name} » ({doc_type_label}) dans votre dossier médical.",
            donnees_supplementaires={
                "document_id": str(document.id),
                "type_document": document.type_document,
                "medecin_id": str(medecin_user.id),
            },
        )
        db.add(notification)
        db.commit()
    except Exception:
        db.rollback()
