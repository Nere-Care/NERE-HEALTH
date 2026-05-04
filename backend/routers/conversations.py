from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Conversation, Patient, RendezVous, User
from backend.schemas import ConversationCreate, ConversationRead

router = APIRouter(tags=["conversations"])


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
    elif current_user.role == "medecin":
        stmt = stmt.where(Conversation.medecin_id == current_user.id)
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
    return conversations


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_create: ConversationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        conversation_create.patient_id = current_user.id
    elif current_user.role == "medecin":
        conversation_create.medecin_id = current_user.id
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not conversation_create.patient_id or not db.get(Patient, conversation_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if not conversation_create.medecin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin requis")
    medecin = db.get(User, conversation_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")
    if conversation_create.rdv_id and not db.get(RendezVous, conversation_create.rdv_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

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
    if current_user.role == "patient" and conversation.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and conversation.medecin_id != current_user.id:
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
    if current_user.role == "patient" and conversation.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and conversation.medecin_id != current_user.id:
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
