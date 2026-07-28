import json
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from db import SessionLocal 
from models import User, Message, Conversation, RendezVous # ✅ Ajout des modèles
from config import settings
from .ws_manager import manager

from .webrtc_manager import room_manager

from uuid import UUID as UUIDType

router = APIRouter(tags=["websocket"])
ALGORITHM = "HS256"

def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except JWTError:
        return None

@router.websocket("/ws/messages")
async def websocket_messages(websocket: WebSocket, token: str = Query(...)):
    await websocket.accept()
    db = SessionLocal()
    user_id = None

    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = str(user.id)
        await manager.connect(user_id, websocket, accept_first=False)

        # ✅ BOUCLE DE TRAITEMENT DES MESSAGES
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            conv_id = payload.get("conversation_id")
            texte = payload.get("texte")

            if conv_id and texte:
                # 1. Sauvegarder le message en BDD
                nouveau_message = Message(
                    conversation_id=conv_id,
                    expediteur_id=user.id,
                    contenu=texte,
                    type="texte",
                    lu_par_destinataire=False,
                    signale=False,
                    supprime_par_expediteur=False
                )
                db.add(nouveau_message)
                
                # 2. Mettre à jour les métadonnées de la conversation
                conv = db.get(Conversation, conv_id)
                autre_user_id = None
                if conv:
                    conv.dernier_message_at = datetime.now(timezone.utc)
                    conv.dernier_message_preview = texte[:200]
                    # Trouver l'ID de l'autre participant
                    autre_user_id = str(conv.patient_id) if str(conv.patient_id) != user_id else str(conv.medecin_id)
                
                db.commit()
                db.refresh(nouveau_message)

                # 3. Formater pour le frontend
                msg_dict = {
                    "id": str(nouveau_message.id),
                    "texte": nouveau_message.contenu,
                    "heure": nouveau_message.created_at.strftime("%H:%M") if nouveau_message.created_at else "",
                    "est_moi": True
                }

                # 4. Envoyer au destinataire
                if autre_user_id:
                    await manager.send_to_user(autre_user_id, {
                        "event": "nouveau_message",
                        "conversation_id": conv_id,
                        "message": {**msg_dict, "est_moi": False}
                    })
                
                # 5. Accuser réception à l'expéditeur (pour l'UI optimiste)
                await websocket.send_json({
                    "event": "message_envoye",
                    "message": msg_dict
                })

    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(user_id, websocket)
    except Exception as e:
        if "transfer_data_task" not in str(e):
            print(f"⚠️ Erreur WebSocket: {e}")
        if user_id:
            manager.disconnect(user_id, websocket)
    finally:
        db.close()




@router.websocket("/ws/teleconsultation/{rdv_id}")
async def websocket_teleconsultation(websocket: WebSocket, rdv_id: str, token: str = Query(...)):
    await websocket.accept()
    db = SessionLocal()
    user_id = None
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        try:
            rdv = db.get(RendezVous, UUIDType(rdv_id))
        except ValueError:
            rdv = None

        if not rdv or (str(rdv.patient_id) != str(user.id) and str(rdv.medecin_id) != str(user.id)):
            print(f"⛔ WEBRTC: Utilisateur {user.email} n'appartient pas au RDV {rdv_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = str(user.id)
        role = "medecin" if str(rdv.medecin_id) == user_id else "patient"
        print(f"✅ WEBRTC: {user.email} ({role}) a rejoint la salle {rdv_id}")

        await room_manager.join_room(rdv_id, user_id, websocket)

        # Prevenir l'autre participant qu'un pair vient de rejoindre
        await room_manager.relay_to_others(rdv_id, websocket, {
            "type": "peer-joined",
            "role": role,
        })

        while True:
            data = await websocket.receive_json()
            # Relayer offer/answer/ice-candidate a l'autre participant de la salle
            await room_manager.relay_to_others(rdv_id, websocket, data)
            print(f"📡 WEBRTC: relais du message '{data.get('type')}' dans la salle {rdv_id}")

    except WebSocketDisconnect:
        print(f"🔌 WEBRTC: Deconnexion (user_id={user_id})")
        room_manager.leave_room(rdv_id, websocket)
        await room_manager.relay_to_others(rdv_id, websocket, {"type": "peer-left"})
    except Exception as e:
        print(f"⚠️ WEBRTC ERROR: {e}")
        room_manager.leave_room(rdv_id, websocket)
    finally:
        db.close()