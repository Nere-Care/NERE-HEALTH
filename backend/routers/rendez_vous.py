import secrets
import string
from datetime import datetime, time as dt_time, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from config import settings
from db import get_db
from models import (
    Consultation,
    Conversation,
    DossierMedical,
    Disponibilite,
    ExceptionDisponibilite,
    Medecin,
    MedecinSpecialite,
    Message,
    Notification,
    Patient,
    RendezVous,
    Specialite,
    Structure,
    User,
)
from schemas import RendezVousCreate, RendezVousRead
from services.livekit import generate_livekit_token
from timezone import to_local, DEFAULT_TZ

router = APIRouter(tags=["rendez_vous"])

DAY_NAME_MAP = {
    0: "lundi", 1: "mardi", 2: "mercredi", 3: "jeudi",
    4: "vendredi", 5: "samedi", 6: "dimanche",
}





def _validate_slot_availability(
    db: Session,
    medecin_id: UUID,
    debut,
    fin,
):
    medecin_user = db.get(User, medecin_id)
    medecin_tz_name = getattr(medecin_user, "timezone", None) or DEFAULT_TZ if medecin_user else DEFAULT_TZ
    debut_local = to_local(debut, medecin_tz_name)
    fin_local = to_local(fin, medecin_tz_name)
    target_date = debut_local.date()
    jour_nom = DAY_NAME_MAP[target_date.weekday()]

    conflict_stmt = select(RendezVous).where(
        RendezVous.medecin_id == medecin_id,
        RendezVous.date_heure_debut < fin,
        RendezVous.date_heure_fin > debut,
        RendezVous.statut.notin_(["annule_patient", "annule_medecin", "annule_systeme"]),
    )
    if db.execute(conflict_stmt).scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce créneau est déjà réservé pour ce médecin",
        )

    exception_stmt = select(ExceptionDisponibilite).where(
        ExceptionDisponibilite.medecin_id == medecin_id,
        ExceptionDisponibilite.date == target_date,
        ExceptionDisponibilite.actif == True,
    )
    exception = db.execute(exception_stmt).scalars().first()
    if exception:
        if exception.type == "indisponible":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le médecin est indisponible à cette date",
            )
        if exception.type == "horaires_personnalises" and exception.creneaux:
            slot_in_creneaux = any(
                debut_local.time() >= dt_time.fromisoformat(c["start"])
                and fin_local.time() <= dt_time.fromisoformat(c["end"])
                for c in exception.creneaux
                if c.get("start") and c.get("end")
            )
            if not slot_in_creneaux:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ce créneau ne correspond pas aux horaires personnalisés du médecin",
                )
            return
        return

    disp_stmt = select(Disponibilite).where(
        Disponibilite.medecin_id == medecin_id,
        Disponibilite.jour_semaine == jour_nom,
        Disponibilite.actif == True,
    )
    disponibilites = db.execute(disp_stmt).scalars().all()

    if not disponibilites:
        return

    for disp in disponibilites:
        if disp.date_debut_validite and target_date < disp.date_debut_validite:
            continue
        if disp.date_fin_validite and target_date > disp.date_fin_validite:
            continue

        if disp.recurrence == "unique":
            debut_validite = disp.date_debut_validite
            if not debut_validite:
                continue
            diff = (target_date - debut_validite).days
            if diff < 0 or diff >= 7:
                continue
        elif disp.recurrence == "bi_mensuel":
            debut_validite = disp.date_debut_validite
            if not debut_validite:
                continue
            diff_weeks = (target_date - debut_validite).days // 7
            if diff_weeks < 0 or diff_weeks % 2 != 0:
                continue

        if debut_local.time() >= disp.heure_debut and fin_local.time() <= disp.heure_fin:
            return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Ce créneau ne fait pas partie des disponibilités du médecin",
    )


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
    elif current_user.role == "patient":
        stmt = stmt.where(RendezVous.patient_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if patient_id:
        stmt = stmt.where(RendezVous.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(RendezVous.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(RendezVous.statut == statut)

    stmt = stmt.order_by(RendezVous.date_heure_debut.desc()).limit(limit)
    rendez_vous = db.execute(stmt).scalars().all()
    return rendez_vous


@router.post("/rendez_vous", response_model=RendezVousRead, status_code=status.HTTP_201_CREATED)
async def create_rendez_vous(
    rendez_vous_create: RendezVousCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    if current_user.role in ("patient", "medecin") and current_user.statut in ("suspendu", "banni"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte est suspendu. Impossible de créer des rendez-vous.")

    if current_user.role == "patient":
        patient = db.get(Patient, current_user.id)
        if not patient:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil patient introuvable")
        rendez_vous_create.patient_id = current_user.id
    elif not db.get(Patient, rendez_vous_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if current_user.role == "medecin":
        rendez_vous_create.medecin_id = current_user.id
    elif current_user.role == "patient":
        medecin = db.get(User, rendez_vous_create.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")
        if medecin.statut in ("suspendu", "banni"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce médecin est indisponible")
    else:
        medecin = db.get(User, rendez_vous_create.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")
        if medecin.statut == "suspendu":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce médecin est suspendu et ne peut pas recevoir de rendez-vous")

    medecin_profile = db.get(Medecin, rendez_vous_create.medecin_id)
    if medecin_profile and not medecin_profile.disponible_maintenant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce médecin est indisponible pour le moment")

    if not rendez_vous_create.numero_rdv:
        rendez_vous_create.numero_rdv = f"RDV-{secrets.token_hex(4).upper()}"

    _validate_slot_availability(
        db,
        rendez_vous_create.medecin_id,
        rendez_vous_create.date_heure_debut,
        rendez_vous_create.date_heure_fin,
    )

    rendez_vous = RendezVous(**rendez_vous_create.dict(exclude_unset=True))
    if rendez_vous.type == "presentiel":
        rendez_vous.code_verification = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

    if current_user.role == "patient":
        if medecin_profile and medecin_profile.tarif_consultation:
            rendez_vous.montant = medecin_profile.tarif_consultation
            rendez_vous.devise = medecin_profile.devise or "XAF"
        rendez_vous.statut = "en_attente_paiement"

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


def _send_rdv_code_message(db: Session, rdv: RendezVous):
    try:
        medecin_user = db.get(User, rdv.medecin_id)
        medecin_profile = db.get(Medecin, rdv.medecin_id)
        patient_user = db.get(User, rdv.patient_id)

        medecin_name = f"{medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else "le médecin"

        specialite = ""
        if medecin_profile:
            spec_row = (
                db.query(Specialite.libelle_fr)
                .join(MedecinSpecialite, MedecinSpecialite.specialite_id == Specialite.id)
                .filter(MedecinSpecialite.medecin_id == medecin_profile.id)
                .first()
            )
            if spec_row:
                specialite = spec_row[0]

        structure_id = rdv.structure_id or (medecin_profile.structure_id if medecin_profile else None)
        structure_name = ""
        if structure_id:
            structure = db.get(Structure, structure_id)
            if structure:
                structure_name = structure.nom_etablissement or ""

        patient_tz_name = getattr(patient_user, "timezone", None) or DEFAULT_TZ
        medecin_tz_name = getattr(medecin_user, "timezone", None) or DEFAULT_TZ

        date_str = to_local(rdv.date_heure_debut, patient_tz_name).strftime("%d/%m/%Y") if rdv.date_heure_debut else ""
        heure_str = to_local(rdv.date_heure_debut, patient_tz_name).strftime("%H:%M") if rdv.date_heure_debut else ""
        motif = rdv.motif_consultation or "Consultation générale"

        titre = f"Rendez-vous confirmé — {motif} le {date_str}"
        contenu = (
            f"Bonjour {patient_user.prenom or ''},\n\n"
            f"Votre rendez-vous a été confirmé.\n\n"
            f"📅 Date : {date_str}\n"
            f"🕐 Heure : {heure_str}\n"
            f"👨‍⚕️ Médecin : Dr {medecin_name}{(' (' + specialite + ')') if specialite else ''}\n"
            f"📍 Lieu : {'Vidéoconférence' if rdv.type != 'presentiel' else (structure_name if structure_name else 'Non précisé')}\n"
            f"📝 Motif : {motif}\n\n"
            + (f"🔐 Code de confirmation : {rdv.code_verification}\n\n"
               "Merci de conserver ce code et de le présenter au médecin avant le début de votre consultation.\n\n"
               if rdv.type == "presentiel" else "")
            + f"Nous vous souhaitons une excellente journée."
        )

        notif = Notification(
            utilisateur_id=rdv.patient_id,
            type="confirmation_rdv",
            canal="in_app",
            statut="envoye",
            titre=titre,
            contenu=contenu,
            reference_externe=str(rdv.id),
        )
        db.add(notif)

        titre_med = f"Nouveau rendez-vous — {motif} le {date_str}"
        contenu_med = (
            f"Bonjour Dr {medecin_name},\n\n"
            f"Vous avez reçu un nouveau rendez-vous.\n\n"
            f"👤 Patient : {patient_user.prenom or ''} {patient_user.nom or ''}\n"
            f"📅 Date : {date_str}\n"
            f"🕐 Heure : {heure_str}\n"
            f"📝 Motif : {motif}\n\n"
            f"Consultez votre agenda pour plus de détails."
        )
        notif_med = Notification(
            utilisateur_id=rdv.medecin_id,
            type="confirmation_rdv",
            canal="in_app",
            statut="envoye",
            titre=titre_med,
            contenu=contenu_med,
            reference_externe=str(rdv.id),
        )
        db.add(notif_med)
        db.commit()
    except Exception as exc:
        import logging
        logging.exception("Erreur envoi code RDV %s: %s", rdv.id, exc)
        db.rollback()


@router.get("/rendez_vous/rappels")
async def check_rappels(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    window_start = now
    window_end = now + timedelta(minutes=30)

    rdvs = db.query(RendezVous).filter(
        RendezVous.date_heure_debut >= window_start,
        RendezVous.date_heure_debut <= window_end,
        RendezVous.statut.in_(["confirme", "en_attente"]),
    ).all()

    expired_rdv_ids = [
        str(r.id) for r in
        db.query(RendezVous.id).filter(RendezVous.date_heure_fin < now).all()
    ]
    if expired_rdv_ids:
        expired_rappels = db.query(Notification).filter(
            Notification.type == "alerte_systeme",
            Notification.reference_externe.in_(expired_rdv_ids),
        ).all()
        for expired in expired_rappels:
            db.delete(expired)
        db.commit()

    sent = 0
    for rdv in rdvs:
        already = db.query(Notification).filter(
            Notification.reference_externe == str(rdv.id),
            Notification.type == "alerte_systeme",
            Notification.utilisateur_id == rdv.medecin_id,
        ).first()
        if already:
            continue

        medecin_user = db.get(User, rdv.medecin_id)
        patient_user = db.get(User, rdv.patient_id)
        medecin_name = f"{medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else "le patient"
        patient_name = f"{patient_user.prenom or ''} {patient_user.nom or ''}".strip() if patient_user else "le patient"
        medecin_tz_name = getattr(medecin_user, "timezone", None) or DEFAULT_TZ if medecin_user else DEFAULT_TZ
        date_str = to_local(rdv.date_heure_debut, medecin_tz_name).strftime("%d/%m/%Y") if rdv.date_heure_debut else ""
        heure_str = to_local(rdv.date_heure_debut, medecin_tz_name).strftime("%H:%M") if rdv.date_heure_debut else ""
        motif = rdv.motif_consultation or "Consultation générale"

        notif = Notification(
            utilisateur_id=rdv.medecin_id,
            type="alerte_systeme",
            canal="in_app",
            statut="envoye",
            titre=f"Rappel — RDV dans 30 min avec {patient_name}",
            contenu=(
                f"Bonjour Dr {medecin_name},\n\n"
                f"Vous avez un rendez-vous dans 30 minutes.\n\n"
                f"👤 Patient : {patient_name}\n"
                f"📅 Date : {date_str}\n"
                f"🕐 Heure : {heure_str}\n"
                f"📝 Motif : {motif}\n\n"
                f"Préparez-vous !"
            ),
            reference_externe=str(rdv.id),
        )
        db.add(notif)
        sent += 1

    if sent:
        db.commit()

    return {"rappels_envoyes": sent}


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
    if current_user.role == "patient" and rendez_vous.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin", "patient"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return rendez_vous


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


@router.put("/rendez_vous/{rendez_vous_id}/start", response_model=RendezVousRead)
async def start_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if rendez_vous.statut not in ("confirme", "en_attente"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce rendez-vous ne peut pas être démarré")

    rendez_vous.statut = "en_cours"
    if not rendez_vous.webrtc_room_id:
        rendez_vous.webrtc_room_id = f"room-{secrets.token_hex(8)}"
    if not rendez_vous.token_medecin:
        rendez_vous.token_medecin = secrets.token_hex(16)
    if not rendez_vous.token_patient:
        rendez_vous.token_patient = secrets.token_hex(16)

    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de démarrage: {exc.orig}") from exc

    return rendez_vous


@router.put("/rendez_vous/{rendez_vous_id}/complete", response_model=RendezVousRead)
async def complete_rendez_vous(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if rendez_vous.statut != "en_cours":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce rendez-vous ne peut pas être terminé",
        )

    rendez_vous.statut = "termine"
    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur de finalisation: {exc.orig}",
        ) from exc

    existing_consult = db.execute(
        select(Consultation).where(Consultation.rdv_id == rendez_vous.id)
    ).scalars().first()
    if not existing_consult:
        dossier = db.query(DossierMedical).filter(
            DossierMedical.patient_id == rendez_vous.patient_id
        ).first()
        if not dossier:
            dossier = DossierMedical(
                numero_dossier=f"DOS-{secrets.token_hex(4).upper()}",
                patient_id=rendez_vous.patient_id,
            )
            db.add(dossier)
            db.flush()
        now = datetime.now(timezone.utc)
        duree = int((now - rendez_vous.date_heure_debut).total_seconds() / 60) if rendez_vous.date_heure_debut else None
        consultation = Consultation(
            numero_consultation=f"CONS-{secrets.token_hex(4).upper()}",
            rdv_id=rendez_vous.id,
            dossier_id=dossier.id if dossier else None,
            medecin_id=rendez_vous.medecin_id,
            patient_id=rendez_vous.patient_id,
            date_heure_debut=rendez_vous.date_heure_debut,
            date_heure_fin=now,
            duree_minutes=duree,
            motif=rendez_vous.motif_consultation or "Consultation",
            statut="termine",
        )
        db.add(consultation)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            import logging
            logging.exception(
                "Échec création de la consultation à la finalisation du RDV %s", rendez_vous.id
            )

    _send_avis_notification(db, rendez_vous)

    return rendez_vous


def _livekit_url_from_request(request: Request) -> str:
    """Construit wss://{hôte}/livekit depuis le Host de la requête.

    Rendre l'URL LiveKit indépendante de l'IP : le frontend rejoint la salle
    via le même hôte que celui qu'il utilise pour l'API (port ignoré).
    """
    host_header = request.headers.get("host", "").strip()
    hostname = host_header.split(":")[0].lower() if host_header else ""
    if hostname:
        return f"wss://{hostname}/livekit"
    return settings.LIVEKIT_URL or ""


@router.get("/rendez_vous/{rendez_vous_id}/token")
async def get_teleconsultation_token(
    rendez_vous_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Renvoie le token LiveKit pour rejoindre la téléconsultation.

    Seuls le médecin et le patient concernés par le RDV peuvent l'obtenir.
    """
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    is_medecin = current_user.role == "medecin" and rendez_vous.medecin_id == current_user.id
    is_patient = current_user.role == "patient" and rendez_vous.patient_id == current_user.id
    if not (is_medecin or is_patient):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le médecin ou le patient de ce rendez-vous peut rejoindre la consultation",
        )

    room = f"nere-{rendez_vous.id}"
    name = f"{current_user.prenom or ''} {current_user.nom or ''}".strip()
    if current_user.role == "medecin":
        name = f"Dr {name}".strip()

    token = generate_livekit_token(room=room, identity=str(current_user.id), name=name)

    return {
        "url": _livekit_url_from_request(request),
        "room": room,
        "token": token,
    }


def _send_avis_notification(db: Session, rdv: RendezVous):
    try:
        medecin_user = db.get(User, rdv.medecin_id)
        medecin_name = f"Dr {medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else "votre médecin"

        motif = rdv.motif_consultation or "Consultation"

        titre = "Consultation terminée — Donnez votre avis"
        contenu = (
            f"Bonjour,\n\n"
            f"Votre consultation avec {medecin_name} pour « {motif} » est terminée.\n\n"
            f"Nous serions reconnaissants de bien vouloir laisser un avis et un commentaire "
            f"sur votre expérience. Votre retour aide les autres patients à choisir leur médecin.\n\n"
            f"Merci !"
        )

        notif = Notification(
            utilisateur_id=rdv.patient_id,
            type="nouveaux_avis",
            canal="in_app",
            statut="envoye",
            titre=titre,
            contenu=contenu,
            reference_externe=str(rdv.medecin_id),
        )
        db.add(notif)
        db.commit()
    except Exception as exc:
        import logging
        logging.exception("Erreur envoi notification avis %s: %s", rdv.id, exc)
        db.rollback()


class RescheduleRequest(BaseModel):
    date_heure_debut: datetime
    date_heure_fin: datetime


@router.put("/rendez_vous/{rendez_vous_id}/reschedule", response_model=RendezVousRead)
async def reschedule_rendez_vous(
    rendez_vous_id: UUID,
    body: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    if current_user.role == "patient" and rendez_vous.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if rendez_vous.statut not in ("confirme", "en_attente"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce rendez-vous ne peut pas être reprogrammé",
        )

    if rendez_vous.date_heure_debut:
        now_utc = datetime.now(timezone.utc)
        hours_until = (rendez_vous.date_heure_debut - now_utc).total_seconds() / 3600
        if hours_until < 48:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La reprogrammation doit se faire au moins 48 heures avant le rendez-vous",
            )

    _validate_slot_availability(
        db,
        rendez_vous.medecin_id,
        body.date_heure_debut,
        body.date_heure_fin,
    )

    rendez_vous.date_heure_debut = body.date_heure_debut
    rendez_vous.date_heure_fin = body.date_heure_fin
    rendez_vous.webrtc_room_id = None
    rendez_vous.token_patient = None
    rendez_vous.token_medecin = None
    rendez_vous.lien_video = None

    if rendez_vous.type == "presentiel":
        rendez_vous.code_verification = ''.join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
        )

    db.add(rendez_vous)
    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erreur de reprogrammation: {exc.orig}",
        ) from exc

    return rendez_vous


class ProposeRescheduleRequest(BaseModel):
    date_heure_debut: datetime
    date_heure_fin: datetime


@router.post("/rendez_vous/{rendez_vous_id}/propose-reschedule")
async def propose_reschedule(
    rendez_vous_id: UUID,
    body: ProposeRescheduleRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if rendez_vous.statut not in ("confirme", "en_attente"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce rendez-vous ne peut pas être reprogrammé")

    now_utc = datetime.now(timezone.utc)

    if rendez_vous.date_heure_debut:
        hours_until = (rendez_vous.date_heure_debut - now_utc).total_seconds() / 3600
        if hours_until < 48:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La reprogrammation doit se faire au moins 48 heures avant le rendez-vous",
            )

    from datetime import timedelta
    rdv_date = rendez_vous.date_heure_debut.date()
    min_date = rdv_date - timedelta(days=5)
    max_date = rdv_date + timedelta(days=7)
    new_date = body.date_heure_debut.date()

    if new_date < min_date or new_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La nouvelle date doit être entre le {min_date} et le {max_date}",
        )

    _validate_slot_availability(
        db,
        rendez_vous.medecin_id,
        body.date_heure_debut,
        body.date_heure_fin,
    )

    patient_user = db.get(User, rendez_vous.patient_id)
    medecin_user = db.get(User, rendez_vous.medecin_id)
    medecin_name = f"Dr {medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else "Votre médecin"

    new_date_str = body.date_heure_debut.strftime("%d/%m/%Y")
    new_heure_str = body.date_heure_debut.strftime("%H:%M")
    old_date_str = rendez_vous.date_heure_debut.strftime("%d/%m/%Y") if rendez_vous.date_heure_debut else ""
    old_heure_str = rendez_vous.date_heure_debut.strftime("%H:%M") if rendez_vous.date_heure_debut else ""

    titre = f"Demande de reprogrammation — {rendez_vous.motif_consultation or 'Consultation'}"
    contenu = (
        f"Bonjour {patient_user.prenom or ''},\n\n"
        f"{medecin_name} souhaite reprogrammer votre rendez-vous.\n\n"
        f"📅 Date actuelle : {old_date_str} à {old_heure_str}\n"
        f"📅 Nouvelle date proposée : {new_date_str} à {new_heure_str}\n\n"
        f"Veuillez confirmer ou refuser cette nouvelle date."
    )

    notif = Notification(
        utilisateur_id=rendez_vous.patient_id,
        type="demande_reprogrammation",
        canal="in_app",
        statut="envoye",
        titre=titre,
        contenu=contenu,
        reference_externe=str(rendez_vous.id),
        donnees_supplementaires={
            "rendez_vous_id": str(rendez_vous.id),
            "ancienne_date": str(rendez_vous.date_heure_debut),
            "nouvelle_date_debut": str(body.date_heure_debut),
            "nouvelle_date_fin": str(body.date_heure_fin),
            "medecin_id": str(rendez_vous.medecin_id),
        },
    )
    db.add(notif)
    db.commit()

    return {"message": "Demande de reprogrammation envoyée au patient"}


@router.post("/rendez_vous/{rendez_vous_id}/accept-reschedule")
async def accept_reschedule(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("patient")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    notif = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id == current_user.id,
            Notification.type == "demande_reprogrammation",
            Notification.reference_externe == str(rendez_vous_id),
        )
        .order_by(Notification.created_at.desc())
        .first()
    )
    if not notif or not notif.donnees_supplementaires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune demande de reprogrammation trouvée")

    if notif.statut == "lu":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande a déjà été traitée")

    data = notif.donnees_supplementaires
    new_debut = data.get("nouvelle_date_debut")
    new_fin = data.get("nouvelle_date_fin")
    if not new_debut or not new_fin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Données de reprogrammation invalides")

    rendez_vous.date_heure_debut = datetime.fromisoformat(new_debut)
    rendez_vous.date_heure_fin = datetime.fromisoformat(new_fin)
    rendez_vous.webrtc_room_id = None
    rendez_vous.token_patient = None
    rendez_vous.token_medecin = None
    rendez_vous.lien_video = None

    if rendez_vous.type == "presentiel":
        rendez_vous.code_verification = ''.join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
        )

    db.add(rendez_vous)

    notif.statut = "lu"
    db.add(notif)

    medecin_user = db.get(User, rendez_vous.medecin_id)
    medecin_name = f"Dr {medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else "le médecin"
    patient_user = db.get(User, rendez_vous.patient_id)

    new_date_str = rendez_vous.date_heure_debut.strftime("%d/%m/%Y")
    new_heure_str = rendez_vous.date_heure_debut.strftime("%H:%M")

    notif_med = Notification(
        utilisateur_id=rendez_vous.medecin_id,
        type="acceptation_reprogrammation",
        canal="in_app",
        statut="envoye",
        titre=f"Reprogrammation acceptée — {patient_user.prenom or ''} {patient_user.nom or ''}",
        contenu=(
            f"Bonjour Dr {medecin_user.prenom or ''},\n\n"
            f"Le patient {patient_user.prenom or ''} {patient_user.nom or ''} a accepté la reprogrammation.\n\n"
            f"📅 Nouvelle date : {new_date_str} à {new_heure_str}\n\n"
            f"Consultez votre agenda pour plus de détails."
        ),
        reference_externe=str(rendez_vous.id),
    )
    db.add(notif_med)

    try:
        db.commit()
        db.refresh(rendez_vous)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur lors de la reprogrammation: {exc.orig}") from exc

    return rendez_vous


@router.post("/rendez_vous/{rendez_vous_id}/reject-reschedule")
async def reject_reschedule(
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("patient")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    notif = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id == current_user.id,
            Notification.type == "demande_reprogrammation",
            Notification.reference_externe == str(rendez_vous_id),
        )
        .order_by(Notification.created_at.desc())
        .first()
    )
    if not notif:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune demande de reprogrammation trouvée")

    if notif.statut == "lu":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande a déjà été traitée")

    notif.statut = "lu"
    db.add(notif)

    medecin_user = db.get(User, rendez_vous.medecin_id)
    patient_user = db.get(User, rendez_vous.patient_id)

    notif_med = Notification(
        utilisateur_id=rendez_vous.medecin_id,
        type="refus_reprogrammation",
        canal="in_app",
        statut="envoye",
        titre=f"Reprogrammation refusée — {patient_user.prenom or ''} {patient_user.nom or ''}",
        contenu=(
            f"Bonjour Dr {medecin_user.prenom or ''},\n\n"
            f"Le patient {patient_user.prenom or ''} {patient_user.nom or ''} a refusé la reprogrammation.\n\n"
            f"Le rendez-vous reste à sa date initiale."
        ),
        reference_externe=str(rendez_vous.id),
    )
    db.add(notif_med)
    db.commit()

    return {"message": "Reprogrammation refusée"}


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


from pydantic import BaseModel as PydanticBaseModel


class VerifyCodeRequest(PydanticBaseModel):
    nss: str
    code: str


@router.post("/rendez_vous/{rendez_vous_id}/verify")
async def verify_rdv_code(
    rendez_vous_id: UUID,
    body: VerifyCodeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    patient = db.get(Patient, rendez_vous.patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if not patient.nss or patient.nss.strip() != body.nss.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="NSS incorrect")

    matching_rdv = (
        db.query(RendezVous)
        .filter(
            RendezVous.patient_id == rendez_vous.patient_id,
            RendezVous.type == "presentiel",
            RendezVous.code_verification.isnot(None),
            func.upper(RendezVous.code_verification) == body.code.strip().upper(),
        )
        .first()
    )

    if not matching_rdv:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code de vérification incorrect")

    rdv_date = matching_rdv.date_heure_debut
    if rdv_date:
        today = datetime.now(timezone.utc).date()
        if rdv_date.date() != today:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce code n'est actif que le jour du rendez-vous")

    return {"verified": True, "message": "Vérification réussie"}
