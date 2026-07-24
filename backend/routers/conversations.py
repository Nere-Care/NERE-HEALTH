from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import (
    Conversation,
    DemandeAvisMedical,
    Patient,
    RendezVous,
    Specialite,
    User,
)
from schemas import ConversationCreate, ConversationRead

router = APIRouter(tags=["conversations"])


def _can_access_conversation(user, conv: Conversation, db: Session) -> bool:
    if user.role == "admin":
        return True
    if conv.patient_id and user.id == conv.patient_id:
        return True
    if conv.medecin_id and user.id == conv.medecin_id:
        return True
    if conv.demande_avis_id:
        demande = db.get(DemandeAvisMedical, conv.demande_avis_id)
        if demande and user.id in (demande.medecin_demandeur_id, demande.medecin_cible_id, demande.medecin_accepteur_id):
            return True
    return False


@router.get("/conversations", response_model=List[ConversationRead])
async def list_conversations(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    rdv_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Conversation)
    if current_user.role == "patient":
        stmt = stmt.where(Conversation.patient_id == current_user.id)
    elif current_user.role in ("medecin", "infirmier", "sage_femme"):
        stmt = stmt.where(
            (Conversation.medecin_id == current_user.id)
            | (Conversation.demande_avis_id.isnot(None))
        )
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(Conversation.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Conversation.medecin_id == medecin_id)
    if rdv_id:
        stmt = stmt.where(Conversation.rdv_id == rdv_id)
    if statut:
        stmt = stmt.where(Conversation.statut == statut)

    conversations = db.execute(stmt.order_by(Conversation.updated_at.desc()).limit(limit)).scalars().all()

    results = []
    for conv in conversations:
        if not _can_access_conversation(current_user, conv, db):
            continue
        med = db.get(User, conv.medecin_id) if conv.medecin_id else None
        pat = db.get(Patient, conv.patient_id) if conv.patient_id else None
        pat_user = db.get(User, pat.id) if pat else None

        other_medecin_nom = None
        demande_medecin_demandeur_nom = None
        demande_medecin_cible_nom = None
        demande_medecin_demandeur_id = None
        demande_medecin_cible_id = None
        demande_dossier_medical_id = None
        demande_consultation_id = None
        demande_motif = None
        demande_specialite = None
        demande_patient_nom = None
        demande_statut = None
        if conv.demande_avis_id:
            demande = db.get(DemandeAvisMedical, conv.demande_avis_id)
            if demande:
                other_id = demande.medecin_demandeur_id if demande.medecin_cible_id == current_user.id else demande.medecin_cible_id
                other_user = db.get(User, other_id)
                if other_user:
                    other_medecin_nom = f"{other_user.prenom or ''} {other_user.nom or ''}".strip()

                demandeur_user = db.get(User, demande.medecin_demandeur_id)
                if demandeur_user:
                    demande_medecin_demandeur_nom = f"{demandeur_user.prenom or ''} {demandeur_user.nom or ''}".strip()

                cible_user = db.get(User, demande.medecin_cible_id) if demande.medecin_cible_id else None
                if cible_user:
                    demande_medecin_cible_nom = f"{cible_user.prenom or ''} {cible_user.nom or ''}".strip()

                demande_medecin_demandeur_id = demande.medecin_demandeur_id
                demande_medecin_cible_id = demande.medecin_cible_id
                demande_dossier_medical_id = demande.dossier_medical_id
                demande_consultation_id = demande.consultation_id
                demande_motif = demande.motif
                demande_statut = demande.statut
                spec = db.get(Specialite, demande.specialite_id)
                if spec:
                    demande_specialite = spec.libelle_fr or spec.libelle_en
                if demande.patient_id:
                    pat_obj = db.get(Patient, demande.patient_id)
                    if pat_obj:
                        pat_user_obj = db.get(User, pat_obj.id)
                        if pat_user_obj:
                            demande_patient_nom = f"{pat_user_obj.prenom or ''} {pat_user_obj.nom or ''}".strip()

        data = {
            "id": conv.id,
            "patient_id": conv.patient_id,
            "medecin_id": conv.medecin_id,
            "rdv_id": conv.rdv_id,
            "demande_avis_id": conv.demande_avis_id,
            "statut": conv.statut,
            "nb_messages_non_lus_patient": conv.nb_messages_non_lus_patient,
            "nb_messages_non_lus_medecin": conv.nb_messages_non_lus_medecin,
            "dernier_message_at": conv.dernier_message_at,
            "dernier_message_preview": conv.dernier_message_preview,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "medecin_nom": f"{med.prenom or ''} {med.nom or ''}".strip() if med else None,
            "patient_nom": f"{pat_user.prenom or ''} {pat_user.nom or ''}".strip() if pat_user else None,
            "other_medecin_nom": other_medecin_nom,
            "demande_medecin_demandeur_nom": demande_medecin_demandeur_nom,
            "demande_medecin_cible_nom": demande_medecin_cible_nom,
            "demande_medecin_demandeur_id": demande_medecin_demandeur_id,
            "demande_medecin_cible_id": demande_medecin_cible_id,
            "demande_dossier_medical_id": demande_dossier_medical_id,
            "demande_consultation_id": demande_consultation_id,
            "demande_motif": demande_motif,
            "demande_specialite": demande_specialite,
            "demande_patient_nom": demande_patient_nom,
            "demande_statut": demande_statut,
        }
        results.append(data)

    return results


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_create: ConversationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        conversation_create.patient_id = current_user.id
    elif current_user.role == "medecin":
        if not conversation_create.patient_id and not conversation_create.demande_avis_id:
            conversation_create.medecin_id = current_user.id
        elif conversation_create.medecin_id is None:
            conversation_create.medecin_id = current_user.id
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if conversation_create.rdv_id:
        rdv = db.get(RendezVous, conversation_create.rdv_id)
        if not rdv:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")
        if not conversation_create.patient_id:
            conversation_create.patient_id = rdv.patient_id
        if not conversation_create.medecin_id:
            conversation_create.medecin_id = rdv.medecin_id

    # Deduplication: return existing conversation between patient and medecin if present
    if conversation_create.patient_id and conversation_create.medecin_id and not conversation_create.demande_avis_id:
        if conversation_create.rdv_id:
            existing_rdv = db.execute(
                select(Conversation).where(Conversation.rdv_id == conversation_create.rdv_id)
            ).scalars().first()
            if existing_rdv:
                if current_user.role in ("medecin", "admin") and existing_rdv.statut == "fermee":
                    existing_rdv.statut = "active"
                    db.add(existing_rdv)
                    db.commit()
                    db.refresh(existing_rdv)
                return existing_rdv

        existing_pm = db.execute(
            select(Conversation).where(
                Conversation.patient_id == conversation_create.patient_id,
                Conversation.medecin_id == conversation_create.medecin_id,
                Conversation.demande_avis_id.is_(None)
            )
        ).scalars().first()
        if existing_pm:
            if conversation_create.rdv_id and not existing_pm.rdv_id:
                existing_pm.rdv_id = conversation_create.rdv_id
            if current_user.role in ("medecin", "admin") and existing_pm.statut == "fermee":
                existing_pm.statut = "active"
            db.add(existing_pm)
            db.commit()
            db.refresh(existing_pm)
            return existing_pm

    if conversation_create.patient_id and not db.get(Patient, conversation_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if not conversation_create.medecin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin requis")
    medecin = db.get(User, conversation_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")
    if conversation_create.demande_avis_id:
        demande = db.get(DemandeAvisMedical, conversation_create.demande_avis_id)
        if not demande:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Demande d'avis introuvable")

    conversation = Conversation(**conversation_create.dict(exclude_unset=True))
    db.add(conversation)
    try:
        db.commit()
        db.refresh(conversation)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la conversation") from exc
    return conversation


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
async def read_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation non trouvée")
    if not _can_access_conversation(current_user, conversation, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return conversation


@router.put("/conversations/{conversation_id}", response_model=ConversationRead)
async def update_conversation(
    conversation_id: UUID,
    conversation_update: ConversationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation non trouvée")
    if not _can_access_conversation(current_user, conversation, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if conversation_update.patient_id and not db.get(Patient, conversation_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if conversation_update.medecin_id:
        medecin = db.get(User, conversation_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in conversation_update.dict(exclude_unset=True).items():
        setattr(conversation, field, value)

    db.add(conversation)
    try:
        db.commit()
        db.refresh(conversation)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la conversation: {exc.orig}") from exc
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation non trouvée")
    db.delete(conversation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
