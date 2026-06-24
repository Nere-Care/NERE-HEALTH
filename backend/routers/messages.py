from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


from auth import get_current_active_user
from db import get_db
from models import Conversation, Message, User, Patient, Medecin
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



@router.get("/mes-conversations")
async def mes_conversations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Conversation).where(
        or_(
            Conversation.patient_id == current_user.id,
            Conversation.medecin_id == current_user.id,
        )
    ).order_by(Conversation.dernier_message_at.desc().nullslast())

    convs = db.execute(stmt).scalars().all()
    result = []

    for conv in convs:
        # Récupérer l'interlocuteur
        if current_user.role == "patient":
            interlocuteur = db.get(User, conv.medecin_id)
        else:
            interlocuteur = db.get(User, conv.patient_id)

        if not interlocuteur:
            continue

        result.append({
            "id": str(conv.id),
            "nom": f"Dr. {interlocuteur.prenom} {interlocuteur.nom}"
                   if interlocuteur.role == "medecin"
                   else f"{interlocuteur.prenom} {interlocuteur.nom}",
            "role": interlocuteur.role,
            "statut": conv.statut,
            "non_lus": conv.nb_messages_non_lus_patient
                       if current_user.role == "patient"
                       else conv.nb_messages_non_lus_medecin,
            "dernier_message": conv.dernier_message_preview or "",
            "dernier_message_at": conv.dernier_message_at.strftime("%H:%M")
                                  if conv.dernier_message_at else "",
            "rdv_id": str(conv.rdv_id) if conv.rdv_id else None,
        })

    return result


@router.get("/mes-conversations/{conv_id}/messages")
async def messages_conversation(
    conv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(404, "Conversation introuvable")

    if current_user.id not in (conv.patient_id, conv.medecin_id):
        raise HTTPException(403, "Accès refusé")

    # Marquer comme lu
    if current_user.role == "patient":
        conv.nb_messages_non_lus_patient = 0
    else:
        conv.nb_messages_non_lus_medecin = 0
    db.commit()

    msgs = db.execute(
        select(Message, User)
        .join(User, Message.expediteur_id == User.id)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
    ).all()

    result = []
    for msg, expediteur in msgs:
        try:
            # Déchiffrement pgp_sym_decrypt
            from sqlalchemy import text
            row = db.execute(
                text("SELECT pgp_sym_decrypt(:data, 'cle_demo_nere') AS texte"),
                {"data": msg.contenu_chiffre}
            ).fetchone()
            texte = row.texte if row else "[message illisible]"
        except Exception:
            texte = "[message illisible]"

        result.append({
            "id": str(msg.id),
            "expediteur_id": str(msg.expediteur_id),
            "expediteur_nom": f"{expediteur.prenom} {expediteur.nom}",
            "est_moi": msg.expediteur_id == current_user.id,
            "texte": texte,
            "type": msg.type or "texte",
            "heure": msg.created_at.strftime("%H:%M"),
            "lu": msg.lu_par_destinataire or False,
        })

    return result


@router.post("/mes-conversations/{conv_id}/messages")
async def envoyer_message(
    conv_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(404, "Conversation introuvable")

    if current_user.id not in (conv.patient_id, conv.medecin_id):
        raise HTTPException(403, "Accès refusé")

    texte = body.get("texte", "").strip()
    if not texte:
        raise HTTPException(400, "Message vide")

    from sqlalchemy import text as sql_text
    row = db.execute(
        sql_text("SELECT pgp_sym_encrypt(:texte, 'cle_demo_nere') AS chiffre"),
        {"texte": texte}
    ).fetchone()

    msg = Message(
        conversation_id=conv_id,
        expediteur_id=current_user.id,
        contenu_chiffre=row.chiffre,
        type="texte",
        lu_par_destinataire=False,
    )
    db.add(msg)

    # Mise à jour conversation
    conv.dernier_message_preview = texte[:80]
    from datetime import datetime, timezone
    conv.dernier_message_at = datetime.now(timezone.utc)

    if current_user.role == "patient":
        conv.nb_messages_non_lus_medecin = (conv.nb_messages_non_lus_medecin or 0) + 1
    else:
        conv.nb_messages_non_lus_patient = (conv.nb_messages_non_lus_patient or 0) + 1

    db.commit()
    db.refresh(msg)

    return {
        "id": str(msg.id),
        "expediteur_id": str(msg.expediteur_id),
        "est_moi": True,
        "texte": texte,
        "type": "texte",
        "heure": msg.created_at.strftime("%H:%M"),
        "lu": False,
    }
