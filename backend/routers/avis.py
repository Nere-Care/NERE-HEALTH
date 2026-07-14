from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, or_, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Avis, Patient, RendezVous, User, Notification, Conversation

from schemas import AvisCreate, AvisRead
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(tags=["avis"])


@router.get("/avis", response_model=List[AvisRead])
async def list_avis(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    rdv_id: Optional[UUID] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Avis)
    if current_user.role == "patient":
        stmt = stmt.where(Avis.patient_id == current_user.id)
    elif current_user.role == "medecin":
        stmt = stmt.where(Avis.medecin_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(Avis.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Avis.medecin_id == medecin_id)
    if rdv_id:
        stmt = stmt.where(Avis.rdv_id == rdv_id)

    avis_list = db.execute(stmt.order_by(Avis.created_at.desc()).limit(limit)).scalars().all()
    return avis_list


@router.post("/avis", response_model=AvisRead, status_code=status.HTTP_201_CREATED)
async def create_avis(
    avis_create: AvisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient":
        avis_create.patient_id = current_user.id
    elif current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not db.get(Patient, avis_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    medecin = db.get(User, avis_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    if not db.get(RendezVous, avis_create.rdv_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

    if avis_create.note < 1 or avis_create.note > 5:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La note doit être comprise entre 1 et 5")

    avis = Avis(**avis_create.dict(exclude_unset=True))
    db.add(avis)
    try:
        db.commit()
        db.refresh(avis)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de l'avis") from exc
    return avis


@router.get("/avis/{avis_id}", response_model=AvisRead)
async def read_avis(
    avis_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "patient" and avis.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return avis


@router.put("/avis/{avis_id}", response_model=AvisRead)
async def update_avis(
    avis_id: UUID,
    avis_update: AvisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if avis_update.note is not None and (avis_update.note < 1 or avis_update.note > 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La note doit être comprise entre 1 et 5")

    for field, value in avis_update.dict(exclude_unset=True).items():
        setattr(avis, field, value)

    db.add(avis)
    try:
        db.commit()
        db.refresh(avis)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de l'avis: {exc.orig}") from exc
    return avis


@router.delete("/avis/{avis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avis(
    avis_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    avis = db.get(Avis, avis_id)
    if not avis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avis non trouvé")
    if current_user.role == "medecin" and avis.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(avis)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


class FichierJoint(BaseModel):
    nom: str
    type_mime: str
    taille: int
    contenu_base64: str


class DemandeAvisCreate(BaseModel):
    medecin_id: UUID
    motif: str
    urgence: str = "normal"
    contexte: str
    question: str
    examens: Optional[str] = None
    fichiers: Optional[list[FichierJoint]] = None


@router.post("/avis/demandes", status_code=201)
async def creer_demande_avis(
    payload: DemandeAvisCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("patient", "medecin"):
        raise HTTPException(403, "Reserve aux patients et medecins")

    medecin = db.get(User, payload.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(404, "Medecin introuvable")

    if current_user.role == "medecin" and current_user.id == payload.medecin_id:
        raise HTTPException(400, "Vous ne pouvez pas vous envoyer une demande a vous-meme")

    from models import Medecin as MedecinModel
    medecin_profil = db.get(MedecinModel, payload.medecin_id)
    specialite = ""
    if medecin_profil and medecin_profil.specialite:
        specialite = medecin_profil.specialite

    notif = Notification(
        utilisateur_id=payload.medecin_id,
        type="nouveau_message",
        canal="in_app",
        statut="en_attente",
        titre=f"Demande d'avis — {payload.motif}",
        contenu=f"{current_user.prenom} {current_user.nom} demande un avis : {payload.contexte[:100]}",
        donnees_supplementaires={
            "type": "demande_avis",
            "demandeur_id": str(current_user.id),
            "demandeur_nom": f"{current_user.prenom} {current_user.nom}",
            "demandeur_role": current_user.role,
            "patient_id": str(current_user.id),
            "patient_nom": f"{current_user.prenom} {current_user.nom}",
            "motif": payload.motif,
            "urgence": payload.urgence,
            "contexte": payload.contexte,
            "question": payload.question,
            "examens": payload.examens or "",
            "medecin_nom_cible": f"Dr. {medecin.prenom} {medecin.nom}",
            "medecin_specialite": specialite,
            "fichiers": [
                {
                    "nom": f.nom,
                    "type_mime": f.type_mime,
                    "taille": f.taille,
                    "contenu_base64": f.contenu_base64,
                }
                for f in (payload.fichiers or [])
            ],
        },
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Demande envoyee avec succes",
        "notification_id": str(notif.id),
    }


@router.get("/avis/demandes/mes-demandes")
async def mes_demandes_avis(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("patient", "medecin"):
        raise HTTPException(403, "Reserve aux patients et medecins")

    notifs = db.query(Notification).filter(
        Notification.donnees_supplementaires["demandeur_id"].astext == str(current_user.id),
        Notification.donnees_supplementaires["type"].astext == "demande_avis",
    ).order_by(Notification.created_at.desc()).all()

    return [
        {
            "id": str(n.id),
            "medecin_id": str(n.utilisateur_id),
            "doctorName": n.donnees_supplementaires.get("medecin_nom_cible", "Médecin inconnu"),
            "doctorSpeciality": n.donnees_supplementaires.get("medecin_specialite", ""),
            "motif": n.donnees_supplementaires.get("motif", ""),
            "urgence": n.donnees_supplementaires.get("urgence", "normal"),
            "contexte": n.donnees_supplementaires.get("contexte", ""),
            "question": n.donnees_supplementaires.get("question", ""),
            "examens": n.donnees_supplementaires.get("examens", ""),
            "statut": n.donnees_supplementaires.get("reponse_statut", "en_attente"),
            "meetingDate": n.donnees_supplementaires.get("date_rdv"),
            "refusalReason": n.donnees_supplementaires.get("reponse_message", ""),
            "date": n.created_at.strftime("%d/%m/%Y %H:%M"),
        }
        for n in notifs
    ]


@router.get("/avis/demandes/recues")
async def demandes_avis_recues(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    notifs = db.query(Notification).filter(
        Notification.utilisateur_id == current_user.id,
        Notification.type == "nouveau_message",
        Notification.donnees_supplementaires["demandeur_id"].astext != str(current_user.id),
    ).order_by(Notification.created_at.desc()).all()

    return [
        {
            "id": str(n.id),
            "patient_nom": n.donnees_supplementaires.get("patient_nom", ""),
            "patient_id": n.donnees_supplementaires.get("patient_id", ""),
            "demandeur_role": n.donnees_supplementaires.get("demandeur_role", "patient"),
            "motif": n.donnees_supplementaires.get("motif", ""),
            "urgence": n.donnees_supplementaires.get("urgence", "normal"),
            "contexte": n.donnees_supplementaires.get("contexte", ""),
            "question": n.donnees_supplementaires.get("question", ""),
            "examens": n.donnees_supplementaires.get("examens", ""),
            "statut": n.donnees_supplementaires.get("reponse_statut", "en_attente"),
            "meetingDate": n.donnees_supplementaires.get("date_rdv"),
            "date": n.created_at.strftime("%d/%m/%Y %H:%M"),
            "fichiers": n.donnees_supplementaires.get("fichiers", []),
        }
        for n in notifs
        if n.donnees_supplementaires and n.donnees_supplementaires.get("type") == "demande_avis"
    ]


class ReponseDemandeAvis(BaseModel):
    statut: str
    message: Optional[str] = None
    date_rdv: Optional[str] = None
    mode: Optional[str] = None
    duration_minutes: Optional[int] = 30


@router.post("/avis/demandes/{notification_id}/repondre")
async def repondre_demande_avis(
    notification_id: UUID,
    payload: ReponseDemandeAvis,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    if payload.statut not in ("acceptee", "refusee"):
        raise HTTPException(400, "Statut invalide")

    notif = db.get(Notification, notification_id)
    if not notif:
        raise HTTPException(404, "Demande introuvable")
    if notif.utilisateur_id != current_user.id:
        raise HTTPException(403, "Acces refuse")
    if not notif.donnees_supplementaires or notif.donnees_supplementaires.get("type") != "demande_avis":
        raise HTTPException(400, "Cette notification n'est pas une demande d'avis")

    demandeur_id = notif.donnees_supplementaires.get("demandeur_id")
    demandeur_role = notif.donnees_supplementaires.get("demandeur_role", "patient")

    if not demandeur_id:
        raise HTTPException(400, "Demandeur introuvable dans la demande")

    notif.statut = "lu"
    notif.date_lecture = datetime.now(timezone.utc)
    notif.donnees_supplementaires = {
        **notif.donnees_supplementaires,
        "reponse_statut": payload.statut,
        "reponse_message": payload.message or "",
        "date_rdv": payload.date_rdv,
        "mode": payload.mode,
    }

    conversation_id = None
    rdv_id = None

    if payload.statut == "acceptee":
        if demandeur_role == "medecin":
            existing_conv = db.query(Conversation).filter(
                Conversation.patient_id.is_(None),
                or_(
                    and_(
                        Conversation.medecin_id == current_user.id,
                        Conversation.medecin_id_2 == UUID(demandeur_id),
                    ),
                    and_(
                        Conversation.medecin_id == UUID(demandeur_id),
                        Conversation.medecin_id_2 == current_user.id,
                    ),
                ),
            ).first()

            if existing_conv:
                conversation = existing_conv
            else:
                conversation = Conversation(
                    patient_id=None,
                    medecin_id=current_user.id,
                    medecin_id_2=UUID(demandeur_id),
                    statut="active",
                    dernier_message_preview=f"Discussion confreres — {notif.donnees_supplementaires.get('motif', '')}",
                    dernier_message_at=datetime.now(timezone.utc),
                )
                db.add(conversation)
                db.flush()

            conversation_id = str(conversation.id)

        else:
            existing_conv = db.query(Conversation).filter(
                Conversation.patient_id == UUID(demandeur_id),
                Conversation.medecin_id == current_user.id,
            ).first()

            if existing_conv:
                conversation = existing_conv
            else:
                conversation = Conversation(
                    patient_id=UUID(demandeur_id),
                    medecin_id=current_user.id,
                    statut="active",
                    dernier_message_preview=f"Demande d'avis acceptee — {notif.donnees_supplementaires.get('motif', '')}",
                    dernier_message_at=datetime.now(timezone.utc),
                )
                db.add(conversation)
                db.flush()

            conversation_id = str(conversation.id)

        if payload.mode in ("video", "presentiel") and payload.date_rdv:
            from models import RendezVous as RdvModel

            try:
                date_debut = datetime.fromisoformat(payload.date_rdv.replace("Z", "+00:00"))
                date_fin = datetime(
                    date_debut.year, date_debut.month, date_debut.day,
                    date_debut.hour, date_debut.minute + (payload.duration_minutes or 30),
                    tzinfo=date_debut.tzinfo
                )
            except Exception:
                date_debut = datetime.now(timezone.utc)
                date_fin = datetime.now(timezone.utc)

            patient_id_for_rdv = None if demandeur_role == "medecin" else UUID(demandeur_id)

            try:
                rdv = RdvModel(
                    numero_rdv=f"NER-RDV-CONF-{datetime.utcnow().year}-{str(uuid4())[:8].upper()}",
                    patient_id=patient_id_for_rdv,
                    medecin_id=current_user.id,
                    date_heure_debut=date_debut,
                    date_heure_fin=date_fin,
                    type=payload.mode,
                    statut="confirme",
                    motif_consultation=f"Consultation confrere — {notif.donnees_supplementaires.get('motif', '')}",
                    montant=0,
                    devise="XAF",
                )
                db.add(rdv)
                db.flush()
                rdv_id = str(rdv.id)
            except Exception as e:
                print(f"Erreur creation RDV: {e}")

        if payload.message:
            try:
                from models import Message as MessageModel
                from sqlalchemy import text as sql_text

                row = db.execute(
                    sql_text("SELECT pgp_sym_encrypt(:txt, 'cle_demo_nere') AS chiffre"),
                    {"txt": payload.message}
                ).fetchone()

                msg = MessageModel(
                    conversation_id=conversation.id,
                    expediteur_id=current_user.id,
                    contenu_chiffre=row.chiffre,
                    type="texte",
                    lu_par_destinataire=False,
                )
                db.add(msg)
            except Exception as e:
                print(f"Erreur envoi message initial: {e}")

        contenu_notif = f"Dr. {current_user.prenom} {current_user.nom} a accepte votre demande d'avis."
        if payload.mode == "message":
            contenu_notif += " Une conversation a ete ouverte."
        elif payload.mode in ("video", "presentiel") and payload.date_rdv:
            try:
                d = datetime.fromisoformat(payload.date_rdv.replace("Z", "+00:00"))
                contenu_notif += f" Un RDV {payload.mode} est planifie le {d.strftime('%d/%m/%Y a %H:%M')}."
            except Exception:
                pass

        notif_demandeur = Notification(
            utilisateur_id=UUID(demandeur_id),
            type="nouveau_message",
            canal="in_app",
            statut="en_attente",
            titre="Demande d'avis acceptee",
            contenu=contenu_notif,
            donnees_supplementaires={
                "type": "demande_avis_acceptee",
                "conversation_id": conversation_id,
                "rdv_id": rdv_id,
                "medecin_nom": f"Dr. {current_user.prenom} {current_user.nom}",
                "mode": payload.mode,
                "date_rdv": payload.date_rdv,
            },
        )
        db.add(notif_demandeur)

    else:
        notif_demandeur = Notification(
            utilisateur_id=UUID(demandeur_id),
            type="nouveau_message",
            canal="in_app",
            statut="en_attente",
            titre="Demande d'avis refusee",
            contenu=f"Dr. {current_user.prenom} {current_user.nom} a decline votre demande." + (f" Motif: {payload.message}" if payload.message else ""),
            donnees_supplementaires={
                "type": "demande_avis_refusee",
                "medecin_nom": f"Dr. {current_user.prenom} {current_user.nom}",
                "motif_refus": payload.message or "",
            },
        )
        db.add(notif_demandeur)

    db.commit()

    return {
        "message": "Reponse enregistree",
        "statut": payload.statut,
        "conversation_id": conversation_id,
        "rdv_id": rdv_id,
    }