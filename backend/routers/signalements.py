from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Conversation, Patient, Signalement, User
from schemas import SignalementCreate, SignalementRead

router = APIRouter(tags=["signalements"])

MOTIFS_AUTORISES = {
    "Spam ou publicité",
    "Contenu inapproprié",
    "Harcèlement",
    "Usurpation d'identité",
    "Autre",
}


def _peut_acceder_conversation(user, conv: Conversation) -> bool:
    if user.role == "admin":
        return True
    if conv.patient_id and user.id == conv.patient_id:
        return True
    if conv.medecin_id and user.id == conv.medecin_id:
        return True
    return False


@router.post("/signalements", response_model=SignalementRead, status_code=status.HTTP_201_CREATED)
async def creer_signalement(
    payload: SignalementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conversation = db.get(Conversation, payload.conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation non trouvée")
    if not _peut_acceder_conversation(current_user, conversation):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    motif = (payload.motif or "").strip()
    if not motif:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le motif est requis")

    signalement = Signalement(
        conversation_id=conversation.id,
        signalant_id=current_user.id,
        signalant_role=current_user.role,
        motif=motif,
        details=(payload.details or "").strip() or None,
        statut="en_attente",
    )
    db.add(signalement)
    db.commit()
    db.refresh(signalement)

    return _to_read(signalement, conversation, db)


@router.get("/signalements", response_model=List[SignalementRead])
async def lister_signalements(
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    stmt = select(Signalement)
    if statut:
        stmt = stmt.where(Signalement.statut == statut)
    signalements = db.execute(stmt.order_by(Signalement.created_at.desc())).scalars().all()

    result = []
    for s in signalements:
        conv = db.get(Conversation, s.conversation_id)
        result.append(_to_read(s, conv, db))
    return result


@router.put("/signalements/{signalement_id}", response_model=SignalementRead)
async def traiter_signalement(
    signalement_id: UUID,
    statut: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    signalement = db.get(Signalement, signalement_id)
    if not signalement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Signalement non trouvé")
    if statut not in ("en_attente", "traite", "rejete"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")
    from datetime import datetime, timezone
    signalement.statut = statut
    signalement.traite_par = current_user.id
    signalement.traite_le = datetime.now(timezone.utc)
    db.commit()
    db.refresh(signalement)
    conv = db.get(Conversation, signalement.conversation_id)
    return _to_read(signalement, conv, db)


def _to_read(signalement: Signalement, conv, db: Session) -> SignalementRead:
    signalee_par = None
    if conv:
        med = db.get(User, conv.medecin_id) if conv.medecin_id else None
        pat = db.get(Patient, conv.patient_id) if conv.patient_id else None
        pat_user = db.get(User, pat.id) if pat else None
        if med:
            signalee_par = f"Dr. {(med.prenom or '')} {(med.nom or '')}".strip()
        elif pat_user:
            signalee_par = f"{(pat_user.prenom or '')} {(pat_user.nom or '')}".strip()
    return SignalementRead(
        id=signalement.id,
        conversation_id=signalement.conversation_id,
        signalant_id=signalement.signalant_id,
        signalant_role=signalement.signalant_role,
        motif=signalement.motif,
        details=signalement.details,
        statut=signalement.statut,
        created_at=signalement.created_at,
        conversation_signalee_par=signalee_par,
    )
