from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import RendezVous, User, Patient, Medecin, Notification, Conversation, Paiement
from schemas import RendezVousCreate, RendezVousRead
from datetime import datetime, timedelta
import uuid as uuid_module

from pydantic import BaseModel as PydanticBase


router = APIRouter(tags=["rendez_vous"])


# =====================================================================
# LISTE DES RDV (admin/médecin)
# =====================================================================
@router.get("/rendez_vous", response_model=List[RendezVousRead])
async def list_rendez_vous(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(RendezVous)
    if current_user.role == "medecin":
        stmt = stmt.where(RendezVous.medecin_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    if patient_id:
        stmt = stmt.where(RendezVous.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(RendezVous.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(RendezVous.statut == statut)

    stmt = stmt.order_by(RendezVous.date_heure_debut.desc()).limit(limit)
    rendez_vous = db.execute(stmt).scalars().all()
    return rendez_vous


# =====================================================================
# CRÉER RDV (admin/médecin)
# =====================================================================
@router.post("/rendez_vous", response_model=RendezVousRead, status_code=status.HTTP_201_CREATED)
async def create_rendez_vous(
    rendez_vous_create: RendezVousCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(Patient, rendez_vous_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if current_user.role == "medecin":
        rendez_vous_create.medecin_id = current_user.id
    else:
        medecin = db.get(User, rendez_vous_create.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    rendez_vous = RendezVous(**rendez_vous_create.dict(exclude_unset=True))
    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de rendez-vous"
        if "uq_rendez_vous_numero_rdv" in str(exc.orig):
            detail = "Ce numéro de rendez-vous est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc

    return rendez_vous


# =====================================================================
# LIRE UN RDV
# =====================================================================
@router.get("/rendez_vous/{rendez_vous_id}", response_model=RendezVousRead)
async def read_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return rendez_vous


# =====================================================================
# METTRE À JOUR UN RDV
# =====================================================================
@router.put("/rendez_vous/{rendez_vous_id}", response_model=RendezVousRead)
async def update_rendez_vous(
    rendez_vous_id: UUID,
    rendez_vous_update: RendezVousCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if rendez_vous_update.patient_id and not db.get(Patient, rendez_vous_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if rendez_vous_update.medecin_id and current_user.role == "admin":
        medecin = db.get(User, rendez_vous_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in rendez_vous_update.dict(exclude_unset=True).items():
        setattr(rendez_vous, field, value)

    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de rendez-vous: {exc.orig}") from exc

    return rendez_vous


# =====================================================================
# SUPPRIMER UN RDV
# =====================================================================
@router.delete("/rendez_vous/{rendez_vous_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(rendez_vous)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# =====================================================================
# SCHÉMA POUR CRÉATION RDV PATIENT
# =====================================================================
class RdvPatientCreate(PydanticBase):
    medecin_id: UUID
    date_heure_debut: datetime
    date_heure_fin: datetime
    type: str = "presentiel"
    motif_consultation: Optional[str] = None


# =====================================================================
# CRÉER RDV (PATIENT) - Route unique
# =====================================================================
@router.post("/rendez_vous/patient", status_code=status.HTTP_201_CREATED)
async def patient_creer_rdv(
    payload: RdvPatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Un patient crée un RDV pour lui-même."""
    if current_user.role != "patient":
        raise HTTPException(403, "Réservé aux patients")

    medecin_user = db.get(User, payload.medecin_id)
    if not medecin_user or medecin_user.role != "medecin":
        raise HTTPException(400, "Médecin introuvable")

    medecin_profil = db.get(Medecin, payload.medecin_id)
    if not medecin_profil:
        raise HTTPException(400, "Profil médecin introuvable")

    numero_rdv = f"NER-RDV-{datetime.utcnow().year}-{str(uuid_module.uuid4())[:8].upper()}"

    rdv = RendezVous(
        numero_rdv=numero_rdv,
        patient_id=current_user.id,
        medecin_id=payload.medecin_id,
        structure_id=medecin_profil.structure_id,
        date_heure_debut=payload.date_heure_debut,
        date_heure_fin=payload.date_heure_fin,
        type=payload.type,
        statut="en_attente",
        motif_consultation=payload.motif_consultation,
        montant=medecin_profil.tarif_consultation,
        devise=medecin_profil.devise or "XAF",
    )
    db.add(rdv)
    
    try:
        db.commit()
        db.refresh(rdv)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(400, "Erreur création RDV") from exc

    # ============================================
    # ✅ NOTIFICATIONS avec types existants
    # ============================================
    date_formatee = rdv.date_heure_debut.strftime("%d/%m/%Y à %H:%M")
    
    try:
        # Notification au médecin (utilise rappel_rdv)
        # Notifier le médecin de la nouvelle demande de RDV
        patient_user = db.get(User, current_user.id)
        notif_medecin = Notification(
            utilisateur_id=payload.medecin_id,
            type="rappel_rdv",
            canal="in_app",
            statut="en_attente",
            titre=f"Nouvelle demande de RDV — {patient_user.prenom} {patient_user.nom}",
            contenu=f"{patient_user.prenom} {patient_user.nom} souhaite un rendez-vous {payload.type} le {payload.date_heure_debut.strftime('%d/%m/%Y a %H:%M')}. Motif : {payload.motif_consultation or 'Non precisé'}.",
            donnees_supplementaires={
                "type": "nouvelle_demande_rdv",
                "rdv_id": str(rdv.id),
                "numero_rdv": rdv.numero_rdv,
                "patient_id": str(current_user.id),
                "patient_nom": f"{patient_user.prenom} {patient_user.nom}",
                "patient_telephone": patient_user.telephone or "",
                "date": payload.date_heure_debut.strftime("%d/%m/%Y"),
                "heure": payload.date_heure_debut.strftime("%H:%M"),
                "type_rdv": payload.type,
                "motif": payload.motif_consultation or "Non precisé",
                "montant": float(rdv.montant or 0),
                "devise": rdv.devise or "XAF",
            },
        )
        db.add(notif_medecin)
        db.commit()

        # Notification au patient (utilise confirmation_rdv)
        notif_patient = Notification(
            utilisateur_id=current_user.id,
            type="confirmation_rdv",  # ✅ Type existant
            canal="in_app",
            statut="en_attente",
            titre="✅ Rendez-vous créé",
            contenu=f"Votre RDV avec Dr. {medecin_user.prenom} {medecin_user.nom} le {date_formatee} a bien été enregistré",
            donnees_supplementaires={
                "rdv_id": str(rdv.id),
                "numero_rdv": rdv.numero_rdv,
                "medecin_id": str(medecin_user.id),
                "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}",
                "date": rdv.date_heure_debut.isoformat(),
            },
        )
        db.add(notif_patient)
        
        db.commit()
        print(f"✅ Notifications créées pour RDV {rdv.numero_rdv}")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Erreur notifications (non bloquante): {e}")

    return {
        "id": str(rdv.id),
        "numero_rdv": rdv.numero_rdv,
        "statut": rdv.statut,
        "montant": float(rdv.montant) if rdv.montant else 0,
        "devise": rdv.devise,
        "medecin_id": str(rdv.medecin_id),
        "patient_id": str(rdv.patient_id),
        "date_heure_debut": rdv.date_heure_debut.isoformat(),
        "date_heure_fin": rdv.date_heure_fin.isoformat(),
        "message": "RDV créé. Le médecin a été notifié.",
    }

# =====================================================================
# MES RDV (PATIENT) - Route unique
# =====================================================================
@router.get("/mes-rendez-vous")
async def mes_rendez_vous(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Liste des RDV du patient connecté."""
    if current_user.role != "patient":
        raise HTTPException(403, "Réservé aux patients")

    stmt = (
        select(RendezVous, User)
        .join(User, RendezVous.medecin_id == User.id)
        .where(RendezVous.patient_id == current_user.id)
        .order_by(RendezVous.date_heure_debut.desc())
        .limit(50)
    )
    rows = db.execute(stmt).all()

    return [
        {
            "id": str(r.id),
            "numero_rdv": r.numero_rdv,
            "medecin_nom": f"Dr. {u.prenom} {u.nom}",
            "date": r.date_heure_debut.strftime("%d/%m/%Y"),
            "heure": r.date_heure_debut.strftime("%H:%M"),
            "type": r.type,
            "statut": r.statut,
            "motif": r.motif_consultation or "",
            "montant": float(r.montant) if r.montant else 0,
            "devise": r.devise or "XAF",
        }
        for r, u in rows
    ]


# =====================================================================
# MES RDV (MÉDECIN)
# =====================================================================
@router.get("/medecin/mes-rendez-vous")
async def medecin_mes_rendez_vous(
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Liste des RDV du médecin connecté."""
    if current_user.role != "medecin":
        raise HTTPException(403, "Réservé aux médecins")

    stmt = (
        select(RendezVous, User)
        .join(User, RendezVous.patient_id == User.id)
        .where(RendezVous.medecin_id == current_user.id)
    )
    if statut:
        stmt = stmt.where(RendezVous.statut == statut)
    stmt = stmt.order_by(RendezVous.date_heure_debut.desc()).limit(100)
    rows = db.execute(stmt).all()

    return [
        {
            "id": str(r.id),
            "numero_rdv": r.numero_rdv,
            "patient_nom": f"{u.prenom} {u.nom}",
            "patient_email": u.email,
            "patient_telephone": u.telephone,
            "date": r.date_heure_debut.strftime("%d/%m/%Y"),
            "heure": r.date_heure_debut.strftime("%H:%M"),
            "type": r.type,
            "statut": r.statut,
            "motif": r.motif_consultation or "",
            "montant": float(r.montant) if r.montant else 0,
            "devise": r.devise or "XAF",
        }
        for r, u in rows
    ]


# =====================================================================
# VALIDER UN RDV (MÉDECIN) - Déclenche le débit du paiement
# =====================================================================
@router.post("/rendez_vous/{rdv_id}/valider")
async def valider_rdv(
    rdv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Le médecin valide un RDV → déclenche le débit du paiement pré-autorisé."""
    if current_user.role != "medecin":
        raise HTTPException(403, "Réservé aux médecins")

    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "RDV introuvable")
    if rdv.medecin_id != current_user.id:
        raise HTTPException(403, "Ce RDV ne vous appartient pas")

    # Valider le RDV
    rdv.statut = "confirme"

    # Déclencher le paiement (pré-autorisé → confirmé)
    paiement = db.query(Paiement).filter(
        Paiement.rdv_id == rdv_id,
        Paiement.statut == "initie"
    ).first()

    if paiement:
        paiement.statut = "confirme"
        paiement.date_remboursement = datetime.utcnow()

    db.commit()
    return {"message": "RDV validé et paiement confirmé", "rdv_id": str(rdv_id)}


# =====================================================================
# CHANGER STATUT RDV (MÉDECIN)
# =====================================================================
from pydantic import BaseModel as PydanticBase

class StatutUpdate(PydanticBase):
    statut: str

@router.patch("/medecin/rendez_vous/{rdv_id}/statut")
async def medecin_changer_statut_rdv(
    rdv_id: UUID,
    payload: StatutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "RDV introuvable")
    if rdv.medecin_id != current_user.id:
        raise HTTPException(403, "Acces refuse")

    statuts_valides = ["confirme", "annule_medecin", "en_cours", "termine", "no_show"]
    if payload.statut not in statuts_valides:
        raise HTTPException(400, f"Statut invalide. Valeurs acceptees : {statuts_valides}")

    ancien_statut = rdv.statut
    rdv.statut = payload.statut

    if payload.statut == "confirme" and ancien_statut != "confirme":
        from models import Conversation, Paiement as PaiementModel
        from datetime import datetime, timezone

        # Confirmer le paiement
        paiement = db.query(PaiementModel).filter(
            PaiementModel.rdv_id == rdv.id,
            PaiementModel.statut.in_(["initie", "en_attente"]),
        ).first()
        if paiement:
            paiement.statut = "confirme"

        # Créer conversation
        conv = db.query(Conversation).filter(
            Conversation.patient_id == rdv.patient_id,
            Conversation.medecin_id == current_user.id,
        ).first()
        if not conv:
            conv = Conversation(
                patient_id=rdv.patient_id,
                medecin_id=current_user.id,
                rdv_id=rdv.id,
                statut="active",
                dernier_message_preview="Rendez-vous confirme. Vous pouvez echanger ici.",
                dernier_message_at=datetime.now(timezone.utc),
            )
            db.add(conv)
            db.flush()

        # Notifier le patient avec tous les détails
        patient_user = db.get(User, rdv.patient_id)
        notif = Notification(
            utilisateur_id=rdv.patient_id,
            type="confirmation_rdv",
            canal="in_app",
            statut="en_attente",
            titre="Rendez-vous confirme",
            contenu=f"Dr. {current_user.prenom} {current_user.nom} a accepte votre rendez-vous du {rdv.date_heure_debut.strftime('%d/%m/%Y a %H:%M')}. Votre paiement a ete traite.",
            donnees_supplementaires={
                "type": "rdv_confirme",
                "rdv_id": str(rdv.id),
                "numero_rdv": rdv.numero_rdv,
                "conversation_id": str(conv.id),
                "medecin_nom": f"Dr. {current_user.prenom} {current_user.nom}",
                "date": rdv.date_heure_debut.strftime("%d/%m/%Y"),
                "heure": rdv.date_heure_debut.strftime("%H:%M"),
                "type_rdv": rdv.type,
                "motif": rdv.motif_consultation or "",
            },
        )
        db.add(notif)

        # Notifier le médecin lui-même
        notif_medecin = Notification(
            utilisateur_id=current_user.id,
            type="confirmation_rdv",
            canal="in_app",
            statut="lu",
            titre="RDV confirme avec succes",
            contenu=f"Vous avez confirme le RDV de {patient_user.prenom if patient_user else ''} {patient_user.nom if patient_user else ''} du {rdv.date_heure_debut.strftime('%d/%m/%Y a %H:%M')}.",
            donnees_supplementaires={
                "type": "rdv_confirme",
                "rdv_id": str(rdv.id),
            },
        )
        db.add(notif_medecin)

    elif payload.statut == "annule_medecin":
        from models import Paiement as PaiementModel
        paiement = db.query(PaiementModel).filter(
            PaiementModel.rdv_id == rdv.id,
            PaiementModel.statut.in_(["initie", "en_attente"]),
        ).first()
        if paiement:
            paiement.statut = "annule"

        notif = Notification(
            utilisateur_id=rdv.patient_id,
            type="annulation_rdv",
            canal="in_app",
            statut="en_attente",
            titre="Rendez-vous annule",
            contenu=f"Dr. {current_user.prenom} {current_user.nom} a annule votre rendez-vous du {rdv.date_heure_debut.strftime('%d/%m/%Y a %H:%M')}.",
            donnees_supplementaires={
                "type": "rdv_annule",
                "rdv_id": str(rdv.id),
                "motif": rdv.motif_consultation or "",
                "medecin_nom": f"Dr. {current_user.prenom} {current_user.nom}",
            },
        )
        db.add(notif)

    db.commit()

    return {
        "message": "Statut mis a jour",
        "statut": rdv.statut,
        "conversation_id": str(conv.id) if payload.statut == "confirme" and 'conv' in dir() else None,
    }









import hashlib

@router.post("/medecin/rendez_vous/{rdv_id}/demarrer-teleconsultation")
async def demarrer_teleconsultation(
    rdv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "RDV introuvable")
    if rdv.medecin_id != current_user.id:
        raise HTTPException(403, "Acces refuse")
    if rdv.type != "video":
        raise HTTPException(400, "Ce RDV n'est pas une teleconsultation video")

    rdv.statut = "en_cours"

    lien_patient = f"/teleconsultation/join/{rdv_id}"

    patient_user = db.get(User, rdv.patient_id)
    if patient_user:
        notif = Notification(
            utilisateur_id=rdv.patient_id,
            type="rappel_rdv",
            canal="in_app",
            statut="en_attente",
            titre="Votre teleconsultation est prete",
            contenu=f"Dr. {current_user.prenom} {current_user.nom} a demarre votre teleconsultation. Cliquez pour rejoindre.",
            donnees_supplementaires={
                "type": "teleconsultation_demarree",
                "rdv_id": str(rdv_id),
                "lien_video": lien_patient,
                "medecin_nom": f"Dr. {current_user.prenom} {current_user.nom}",
            },
        )
        db.add(notif)

    db.commit()

    return {
        "rdv_id": str(rdv_id),
        "statut": "en_cours",
    }


@router.get("/medecin/teleconsultations-du-jour")
async def teleconsultations_du_jour(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    from datetime import date
    today = date.today()

    stmt = (
        select(RendezVous, User)
        .join(User, RendezVous.patient_id == User.id)
        .where(RendezVous.medecin_id == current_user.id)
        .where(RendezVous.type == "video")
        .where(RendezVous.statut.in_(["confirme", "en_attente", "en_cours"]))
        .order_by(RendezVous.date_heure_debut.asc())
    )
    rows = db.execute(stmt).all()

    result = []
    for rdv, patient in rows:
        # Generer le lien si pas encore fait
        room_name = rdv.webrtc_room_id
        lien = rdv.lien_video
        if not room_name:
            room_name = f"nere-{hashlib.sha256(str(rdv.id).encode()).hexdigest()[:16]}"
            lien = f"https://meet.jit.si/{room_name}"

        initiales = ""
        if patient.prenom:
            initiales += patient.prenom[0].upper()
        if patient.nom:
            initiales += patient.nom[0].upper()

        result.append({
            "id": str(rdv.id),
            "patientName": f"{patient.prenom} {patient.nom}",
            "patientId": str(patient.id),
            "age": None,
            "motif": rdv.motif_consultation or "Teleconsultation",
            "heure": rdv.date_heure_debut.strftime("%H:%M"),
            "date": rdv.date_heure_debut.strftime("%d/%m/%Y"),
            "statut": rdv.statut,
            "avatar": initiales or "?",
            "lien_video": lien,
            "room_name": room_name,
            "dossier": {
                "antecedents": [],
                "allergies": [],
                "dernierConsultation": None,
            },
        })

    return result


@router.get("/medecin/teleconsultations-historique")
async def teleconsultations_historique(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    stmt = (
        select(RendezVous, User)
        .join(User, RendezVous.patient_id == User.id)
        .where(RendezVous.medecin_id == current_user.id)
        .where(RendezVous.type == "video")
        .where(RendezVous.statut == "termine")
        .order_by(RendezVous.date_heure_debut.desc())
        .limit(20)
    )
    rows = db.execute(stmt).all()

    return [
        {
            "id": str(rdv.id),
            "patient": f"{u.prenom} {u.nom}",
            "date": rdv.date_heure_debut.strftime("%d/%m/%Y"),
            "heure": rdv.date_heure_debut.strftime("%H:%M"),
            "duree": "N/A",
            "diagnostic": rdv.motif_consultation or "Teleconsultation",
        }
        for rdv, u in rows
    ]


@router.patch("/medecin/rendez_vous/{rdv_id}/terminer-teleconsultation")
async def terminer_teleconsultation(
    rdv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    rdv = db.get(RendezVous, rdv_id)
    if not rdv or rdv.medecin_id != current_user.id:
        raise HTTPException(404, "RDV introuvable")

    rdv.statut = "termine"
    db.commit()
    return {"message": "Teleconsultation terminee", "statut": "termine"}
