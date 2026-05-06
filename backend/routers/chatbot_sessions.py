from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import ChatbotSession, Patient, RendezVous, User
from ..schemas import ChatbotSessionCreate, ChatbotSessionRead

router = APIRouter(tags=["chatbot_sessions"])


@router.get("/chatbot_sessions", response_model=List[ChatbotSessionRead])
async def list_chatbot_sessions(
    patient_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(ChatbotSession)
    if current_user.role == "patient":
        stmt = stmt.where(ChatbotSession.patient_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux administrateurs")

    if patient_id:
        stmt = stmt.where(ChatbotSession.patient_id == patient_id)
    if statut:
        stmt = stmt.where(ChatbotSession.statut == statut)

    sessions = db.execute(stmt.order_by(ChatbotSession.updated_at.desc()).limit(limit)).scalars().all()
    return sessions


@router.post("/chatbot_sessions", response_model=ChatbotSessionRead, status_code=status.HTTP_201_CREATED)
async def create_chatbot_session(
    chatbot_create: ChatbotSessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        chatbot_create.patient_id = current_user.id
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not db.get(Patient, chatbot_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if chatbot_create.rdv_cree_id and not db.get(RendezVous, chatbot_create.rdv_cree_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

    chatbot_session = ChatbotSession(**chatbot_create.dict(exclude_unset=True))
    db.add(chatbot_session)
    try:
        db.commit()
        db.refresh(chatbot_session)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la session chatbot"
        ) from exc
    return chatbot_session


@router.get("/chatbot_sessions/{session_id}", response_model=ChatbotSessionRead)
async def read_chatbot_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    session = db.get(ChatbotSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session chatbot non trouvée")
    if current_user.role == "patient" and session.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return session


@router.put("/chatbot_sessions/{session_id}", response_model=ChatbotSessionRead)
async def update_chatbot_session(
    session_id: UUID,
    session_update: ChatbotSessionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    session = db.get(ChatbotSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session chatbot non trouvée")
    if current_user.role == "patient" and session.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("patient", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    for field, value in session_update.dict(exclude_unset=True).items():
        setattr(session, field, value)

    db.add(session)
    try:
        db.commit()
        db.refresh(session)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la session chatbot: {exc.orig}"
        ) from exc
    return session


@router.delete("/chatbot_sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chatbot_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    session = db.get(ChatbotSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session chatbot non trouvée")
    db.delete(session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
