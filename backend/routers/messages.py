from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user
from db import get_db
from models import Conversation, Message
from schemas import MessageCreate, MessageRead

router = APIRouter(tags=["messages"])


@router.get("/messages", response_model=List[MessageRead])
async def list_messages(
    conversation_id: Optional[UUID] = None,
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Message)
    if conversation_id:
        stmt = stmt.where(Message.conversation_id == conversation_id)
    if current_user.role not in ("admin", "medecin", "patient"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux utilisateurs authentifiés")

    messages = db.execute(stmt.order_by(Message.created_at.desc()).limit(limit)).scalars().all()
    return messages


@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_create: MessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conversation = db.get(Conversation, message_create.conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation introuvable")
    if current_user.role == "patient" and conversation.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and conversation.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    message = Message(
        **message_create.dict(exclude_unset=True),
        expediteur_id=current_user.id,
    )
    db.add(message)
    try:
        db.commit()
        db.refresh(message)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du message") from exc
    return message


@router.get("/messages/{message_id}", response_model=MessageRead)
async def read_message(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message non trouvé")
    return message


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message non trouvé")
    if current_user.role != "admin" and message.expediteur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    db.delete(message)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
