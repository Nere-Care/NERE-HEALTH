from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Session as UserSession
from schemas import SessionRead

router = APIRouter(tags=["sessions"])


@router.get("/sessions", response_model=List[SessionRead])
async def list_sessions(
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "admin":
        stmt = select(UserSession).limit(limit)
    else:
        stmt = select(UserSession).where(UserSession.utilisateur_id == current_user.id).limit(limit)

    sessions = db.execute(stmt).scalars().all()
    return sessions


@router.get("/sessions/{session_id}", response_model=SessionRead)
async def read_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    session = db.get(UserSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvée")
    if current_user.role != "admin" and session.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return session


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    session = db.get(UserSession, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session non trouvée")
    if current_user.role != "admin" and session.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    db.delete(session)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
