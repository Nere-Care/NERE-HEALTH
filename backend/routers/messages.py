from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import base64

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user
from crypto import encrypt, decrypt
from db import get_db
from models import Conversation, DemandeAvisMedical, Message, Notification, User
from schemas import MessageCreate, MessageRead

router = APIRouter(tags=["messages"])


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


def _determiner_recipient(user, conv: Conversation, db: Session):
    """Renvoie (user_id_du_recipient, role_du_recipient)."""
    if user.role == "patient":
        return conv.medecin_id, "medecin"
    if conv.patient_id and conv.demande_avis_id is None:
        return conv.patient_id, "patient"
    if conv.demande_avis_id:
        demande = db.get(DemandeAvisMedical, conv.demande_avis_id)
        if demande:
            if user.id == demande.medecin_demandeur_id:
                return demande.medecin_cible_id or demande.medecin_accepteur_id, "medecin"
            return demande.medecin_demandeur_id, "medecin"
    return conv.medecin_id, "medecin"


def _apercu_lisible(raw_bytes: bytes) -> bytes:
    """Convertit le contenu (base64 envoyé par le client) en texte lisible,
    tronqué à une limite d'octets compatible avec la colonne preview (200)."""
    try:
        decoded = base64.b64decode(raw_bytes.decode("utf-8", errors="ignore").strip())
    except Exception:
        decoded = raw_bytes
    if len(decoded) <= 150:
        return decoded
    return decoded[:150].decode("utf-8", errors="ignore").encode("utf-8")


def _notifier_nouveau_message(db: Session, recipient_id, sender_name: str, preview: str, conversation_id: UUID):
    if not recipient_id:
        return
    notification = Notification(
        utilisateur_id=recipient_id,
        type="nouveau_message",
        canal="in_app",
        statut="envoye",
        titre="Nouveau message",
        contenu=f"{sender_name} : {preview}",
        reference_externe=str(conversation_id),
    )
    db.add(notification)


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

    messages = db.execute(stmt.order_by(Message.created_at.asc()).limit(limit)).scalars().all()

    result = []
    for msg in messages:
        try:
            decrypted = decrypt(msg.contenu_chiffre)
        except Exception:
            decrypted = msg.contenu_chiffre
        msg.contenu_chiffre = decrypted
        result.append(msg)
    return result


@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_create: MessageCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.statut in ("suspendu", "banni"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte est suspendu. Impossible d'envoyer des messages.")

    conversation = db.get(Conversation, message_create.conversation_id)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation introuvable")
    if not _can_access_conversation(current_user, conversation, db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if conversation.statut == "fermee":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La conversation est fermée (Lecture seule)")

    if conversation.demande_avis_id:
        demande = db.get(DemandeAvisMedical, conversation.demande_avis_id)
        if demande and demande.statut == "cloturee":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet avis médical est clôturé (Lecture seule)")

    raw_content = message_create.contenu_chiffre
    encrypted = encrypt(raw_content)

    message = Message(
        **message_create.dict(exclude_unset=True, exclude={"contenu_chiffre"}),
        contenu_chiffre=encrypted,
        expediteur_id=current_user.id,
    )
    db.add(message)
    try:
        db.commit()
        db.refresh(message)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du message") from exc

    recipient_id, recipient_role = _determiner_recipient(current_user, conversation, db)
    if recipient_role == "patient":
        conversation.nb_messages_non_lus_patient += 1
    else:
        conversation.nb_messages_non_lus_medecin += 1
    conversation.dernier_message_at = datetime.now(timezone.utc)
    preview_bytes = _apercu_lisible(raw_content)
    preview_text = preview_bytes.decode("utf-8", errors="ignore")
    conversation.dernier_message_preview = base64.b64encode(preview_bytes).decode("ascii")

    sender_name = f"{current_user.prenom or ''} {current_user.nom or ''}".strip() or (current_user.email or "Un utilisateur")
    _notifier_nouveau_message(db, recipient_id, sender_name, preview_text, conversation.id)

    db.commit()

    message.contenu_chiffre = raw_content
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
    try:
        message.contenu_chiffre = decrypt(message.contenu_chiffre)
    except Exception:
        pass
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
