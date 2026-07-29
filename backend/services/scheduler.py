import logging
import threading
import time as _time
from contextlib import contextmanager
from datetime import datetime, timedelta, time, timezone

from sqlalchemy import select, func, text
from sqlalchemy.orm import Session

from db import SessionLocal
from models import Consultation, Ordonnance, PriseMedicament, RendezVous, User, Notification
from services.notification_service import notification_service
from timezone import local_now, local_today, to_local, DEFAULT_TZ

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Advisory lock helpers — ensure only ONE gunicorn worker runs a given job
# ---------------------------------------------------------------------------

# Stable integer keys for each job type (arbitrary but unique)
_LOCK_KEY_MEDICAMENT = 110001
_LOCK_KEY_RDV        = 110002


@contextmanager
def _pg_advisory_lock(db: Session, lock_key: int):
    """Acquire a session-level PostgreSQL advisory lock. Yields True if acquired, False otherwise."""
    row = db.execute(text("SELECT pg_try_advisory_lock(:key)"), {"key": lock_key}).scalar()
    acquired = bool(row)
    try:
        yield acquired
    finally:
        if acquired:
            db.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": lock_key})


MOMENT_LABELS = {
    "MATIN": "matin",
    "MIDI": "midi",
    "SOIR": "soir",
}

MOMENT_HEURES = {
    "MATIN": time(7, 30),
    "MIDI": time(11, 30),
    "SOIR": time(19, 30),
}

WINDOW_MINUTES = 30



def _find_upcoming_prises(db: Session, moment: str) -> list[tuple[PriseMedicament, Ordonnance, User]]:
    now = local_now()
    today = now.date()
    current_time = now.time()

    heure_moment = MOMENT_HEURES[moment]

    window_start_dt = datetime.combine(today, heure_moment) - timedelta(minutes=WINDOW_MINUTES)
    window_end_dt = datetime.combine(today, heure_moment) + timedelta(minutes=WINDOW_MINUTES)
    window_start = window_start_dt.time()
    window_end = window_end_dt.time()

    if not (window_start <= current_time <= window_end):
        return []

    stmt = (
        select(PriseMedicament, Ordonnance, User)
        .join(Ordonnance, PriseMedicament.ordonnance_id == Ordonnance.id)
        .join(User, Ordonnance.patient_id == User.id)
        .where(PriseMedicament.date_prise_prevue == today)
        .where(PriseMedicament.moment_journee == moment)
        .where(PriseMedicament.statut == "A_PRENDRE")
        .where(Ordonnance.statut_traitement == "EN_COURS")
    )

    results = db.execute(stmt).all()
    return [(prise, ordonnance, user) for prise, ordonnance, user in results]


def check_and_send_reminders(moment: str):
    logger.info("Vérification des rappels %s...", moment)
    db = SessionLocal()
    try:
        with _pg_advisory_lock(db, _LOCK_KEY_MEDICAMENT) as acquired:
            if not acquired:
                logger.info("Rappel %s: un autre worker tient le verrou, skip.", moment)
                return

            pairs = _find_upcoming_prises(db, moment)
            if not pairs:
                logger.info("Aucun rappel %s à envoyer.", moment)
                return

            label = MOMENT_LABELS[moment]
            today = local_today()
            sent_count = 0

            for prise, ordonnance, user in pairs:
                already_notified = (
                    db.query(Notification)
                    .filter(
                        Notification.utilisateur_id == user.id,
                        Notification.type == "rappel_prise_medicament",
                        text("donnees_supplementaires->>'prise_id' = :prise_id"),
                        func.date(Notification.created_at) == today,
                    )
                    .params(prise_id=str(prise.id))
                    .first()
                )
                if already_notified:
                    logger.info("Prise %s déjà notifiée aujourd'hui, skip.", prise.id)
                    continue

                donnees = {
                    "ordonnance_id": str(ordonnance.id),
                    "prise_id": str(prise.id),
                    "medicament": prise.medicament_nom,
                    "moment": moment,
                }

                notification_service.send_notification(
                    db=db,
                    utilisateur_id=user.id,
                    type_notif="rappel_prise_medicament",
                    canal="in_app",
                    titre=f"Rappel {label} - {prise.medicament_nom}",
                    contenu=(
                        f"N'oubliez pas de prendre votre {prise.medicament_nom} ({ordonnance.numero}) "
                        f"ce {label}."
                    ),
                    donnees=donnees,
                )
                sent_count += 1

            logger.info("%d rappel(s) %s envoyé(s).", sent_count, moment)
    except Exception:
        logger.exception("Erreur lors de l'envoi des rappels %s", moment)
    finally:
        db.close()


def rappel_matin():
    check_and_send_reminders("MATIN")


def rappel_midi():
    check_and_send_reminders("MIDI")


def rappel_soir():
    check_and_send_reminders("SOIR")


# ---------------------------------------------------------------------------
# Rappels de rendez-vous — J-1, H-1, 30 min — médecins + patients
# ---------------------------------------------------------------------------

RDV_ACTIVE_STATUSES = ("confirme", "en_attente")


def _has_active_consultation(db: Session, rdv: RendezVous) -> bool:
    return db.query(Consultation).filter(
        Consultation.rdv_id == rdv.id,
        Consultation.statut.in_(["en_cours", "termine"]),
    ).first() is not None


def check_rdv_reminders():
    """Vérifie et envoie les rappels J-1, H-1 et 30 min pour tous les RDV actifs."""
    logger.info("Vérification des rappels de rendez-vous...")
    db = SessionLocal()
    sent = 0
    try:
        with _pg_advisory_lock(db, _LOCK_KEY_RDV) as acquired:
            if not acquired:
                logger.info("Rappel RDV: un autre worker tient le verrou, skip.")
                return

            now_utc = datetime.now(timezone.utc)
            now_local = local_now()

            rdvs = db.query(RendezVous).filter(
                RendezVous.date_heure_debut >= now_utc,
                RendezVous.statut.in_(RDV_ACTIVE_STATUSES),
            ).all()

            for rdv in rdvs:
                if _has_active_consultation(db, rdv):
                    continue

                rdv_start = rdv.date_heure_debut
                if rdv_start.tzinfo is None:
                    rdv_start = rdv_start.replace(tzinfo=timezone.utc)
                minutes_until = (rdv_start - now_utc).total_seconds() / 60

                medecin_user = db.get(User, rdv.medecin_id)
                patient_user = db.get(User, rdv.patient_id)
                medecin_name = f"{medecin_user.prenom or ''} {medecin_user.nom or ''}".strip() if medecin_user else ""
                patient_name = f"{patient_user.prenom or ''} {patient_user.nom or ''}".strip() if patient_user else ""
                motif = rdv.motif_consultation or "Consultation générale"

                medecin_tz = getattr(medecin_user, "timezone", None) or DEFAULT_TZ if medecin_user else DEFAULT_TZ
                patient_tz = getattr(patient_user, "timezone", None) or DEFAULT_TZ if patient_user else DEFAULT_TZ
                date_str_m = to_local(rdv_start, medecin_tz).strftime("%d/%m/%Y %H:%M") if rdv_start else ""
                date_str_p = to_local(rdv_start, patient_tz).strftime("%d/%m/%Y %H:%M") if rdv_start else ""

                def _send_rappel(user_id, titre, contenu, label):
                    nonlocal sent
                    if not user_id:
                        return
                    already = db.query(Notification).filter(
                        Notification.utilisateur_id == user_id,
                        Notification.type == "rappel_rdv",
                        Notification.reference_externe == str(rdv.id),
                        text("donnees_supplementaires->>'rappel_type' = :rt"),
                    ).params(rt=label).first()
                    if already:
                        return
                    notification_service.send_notification(
                        db=db,
                        utilisateur_id=user_id,
                        type_notif="rappel_rdv",
                        canal="in_app",
                        titre=titre,
                        contenu=contenu,
                        donnees={"rdv_id": str(rdv.id), "rappel_type": label},
                    )
                    sent += 1

                # J-1 : 24h avant (fenêtre ±15 min pour une vérification toutes les 5 min)
                if 23 * 60 <= minutes_until <= 25 * 60 and not rdv.rappel_j1_envoye:
                    _send_rappel(
                        rdv.medecin_id,
                        f"Rappel J-1 — RDV demain avec {patient_name}",
                        (
                            f"Bonjour Dr {medecin_name},\n\n"
                            f"Vous avez un rendez-vous demain.\n\n"
                            f"👤 Patient : {patient_name}\n"
                            f"📅 Date : {date_str_m}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"Bonne préparation !"
                        ),
                        "J1",
                    )
                    _send_rappel(
                        rdv.patient_id,
                        f"Rappel J-1 — RDV demain avec Dr {medecin_name}",
                        (
                            f"Bonjour {patient_name},\n\n"
                            f"Vous avez un rendez-vous demain.\n\n"
                            f"👨‍⚕️ Médecin : Dr {medecin_name}\n"
                            f"📅 Date : {date_str_p}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"N'oubliez pas !"
                        ),
                        "J1",
                    )
                    rdv.rappel_j1_envoye = True

                # H-1 : 1h avant (fenêtre ±15 min)
                if 55 <= minutes_until <= 65 and not rdv.rappel_h1_envoye:
                    _send_rappel(
                        rdv.medecin_id,
                        f"Rappel H-1 — RDV dans 1h avec {patient_name}",
                        (
                            f"Bonjour Dr {medecin_name},\n\n"
                            f"Votre rendez-vous commence dans 1 heure.\n\n"
                            f"👤 Patient : {patient_name}\n"
                            f"📅 Heure : {date_str_m}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"Préparez-vous !"
                        ),
                        "H1",
                    )
                    _send_rappel(
                        rdv.patient_id,
                        f"Rappel H-1 — RDV dans 1h avec Dr {medecin_name}",
                        (
                            f"Bonjour {patient_name},\n\n"
                            f"Votre rendez-vous commence dans 1 heure.\n\n"
                            f"👨‍⚕️ Médecin : Dr {medecin_name}\n"
                            f"📅 Heure : {date_str_p}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"Préparez-vous !"
                        ),
                        "H1",
                    )
                    rdv.rappel_h1_envoye = True

                # 30 min avant (fenêtre ±10 min)
                if 25 <= minutes_until <= 35:
                    _send_rappel(
                        rdv.medecin_id,
                        f"Rappel 30 min — RDV avec {patient_name}",
                        (
                            f"Bonjour Dr {medecin_name},\n\n"
                            f"Votre rendez-vous commence dans 30 minutes.\n\n"
                            f"👤 Patient : {patient_name}\n"
                            f"📅 Heure : {date_str_m}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"Préparez-vous !"
                        ),
                        "30MIN",
                    )
                    _send_rappel(
                        rdv.patient_id,
                        f"Rappel 30 min — RDV avec Dr {medecin_name}",
                        (
                            f"Bonjour {patient_name},\n\n"
                            f"Votre rendez-vous commence dans 30 minutes.\n\n"
                            f"👨‍⚕️ Médecin : Dr {medecin_name}\n"
                            f"📅 Heure : {date_str_p}\n"
                            f"📝 Motif : {motif}\n\n"
                            f"Préparez-vous !"
                        ),
                        "30MIN",
                    )

            if sent or any(r.rappel_j1_envoye or r.rappel_h1_envoye for r in rdvs):
                db.commit()
            logger.info("%d rappel(s) de RDV envoyé(s).", sent)
    except Exception:
        logger.exception("Erreur lors de la vérification des rappels de RDV")
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Annulation automatique des RDVs en attente de paiement (>24h)
# ---------------------------------------------------------------------------

_LOCK_KEY_CANCEL_UNPAID = 110003


def cancel_expired_unpaid_rdv():
    """Annule les RDVs en attente de paiement depuis plus de 24h après leur heure de fin."""
    logger.info("Vérification des RDVs en attente de paiement expirés...")
    db = SessionLocal()
    cancelled = 0
    try:
        with _pg_advisory_lock(db, _LOCK_KEY_CANCEL_UNPAID) as acquired:
            if not acquired:
                logger.info("Annulation RDV impayés: un autre worker tient le verrou, skip.")
                return

            now_utc = datetime.now(timezone.utc)
            cutoff = now_utc - timedelta(hours=24)

            expired_rdvs = db.query(RendezVous).filter(
                RendezVous.statut == "en_attente_paiement",
                RendezVous.created_at < cutoff,
            ).all()

            for rdv in expired_rdvs:
                rdv.statut = "annule_systeme"
                rdv.motif_annulation = "Paiement non recu sous 24h apres la creation du rendez-vous"
                rdv.date_annulation = now_utc
                cancelled += 1

                patient_user = db.get(User, rdv.patient_id)
                patient_name = f"{patient_user.prenom or ''} {patient_user.nom or ''}".strip() if patient_user else ""
                motif = rdv.motif_consultation or "Consultation"

                if rdv.patient_id:
                    notification_service.send_notification(
                        db=db,
                        utilisateur_id=rdv.patient_id,
                        type_notif="annulation_rdv",
                        canal="in_app",
                        titre="RDV annule — paiement non recu",
                        contenu=(
                            f"Votre rendez-vous ({motif}) "
                            f"prevu le {rdv.date_heure_debut.strftime('%d/%m/%Y a %H:%M') if rdv.date_heure_debut else ''} "
                            f"a ete automatiquement annule car le paiement n'a pas ete effectue sous 24h."
                        ),
                        donnees={"rdv_id": str(rdv.id), "motif": "paiement_expire"},
                    )

            if cancelled:
                db.commit()
            logger.info("%d RDV(s) impaye(s) annule(s).", cancelled)
    except Exception:
        logger.exception("Erreur lors de l'annulation des RDVs impayes")
    finally:
        db.close()



class _CronScheduler:
    """Scheduler léger basé sur threading — aucune dépendance externe."""

    def __init__(self):
        self._jobs: list[dict] = []
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None

    def add_job(self, func, hour: int, minute: int, job_id: str):
        self._jobs.append({
            "func": func,
            "hour": hour,
            "minute": minute,
            "id": job_id,
            "last_run": None,
            "kind": "cron",
        })

    def add_interval_job(self, func, interval_minutes: int, job_id: str):
        self._jobs.append({
            "func": func,
            "interval": timedelta(minutes=interval_minutes),
            "id": job_id,
            "last_run": None,
            "kind": "interval",
        })

    def start(self):
        self._stop.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True, name="cron-scheduler")
        self._thread.start()
        logger.info("CronScheduler démarré avec %d job(s).", len(self._jobs))

    def shutdown(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("CronScheduler arrêté.")

    def _loop(self):
        while not self._stop.is_set():
            now = local_now()
            today = now.date()
            for job in self._jobs:
                try:
                    if job["kind"] == "cron":
                        target = now.replace(hour=job["hour"], minute=job["minute"], second=0, microsecond=0)
                        already_ran = job["last_run"] == today
                        in_window = target <= now <= target + timedelta(minutes=WINDOW_MINUTES)
                        if in_window and not already_ran:
                            logger.info("Exécution du job cron %s", job["id"])
                            job["func"]()
                            job["last_run"] = today
                    elif job["kind"] == "interval":
                        last = job["last_run"]
                        if last is None or (now - last) >= job["interval"]:
                            logger.info("Exécution du job interval %s", job["id"])
                            job["func"]()
                            job["last_run"] = now
                except Exception:
                    logger.exception("Erreur job %s", job["id"])
            _time.sleep(30)


scheduler = _CronScheduler()
