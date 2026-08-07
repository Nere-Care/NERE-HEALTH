from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from db import SessionLocal
from models import RendezVous, User, Notification
from services.email_service import envoyer_email
from routers.ws_manager import manager


def _construire_email_rappel(prenom, nom, interlocuteur, date_str, heure_str, type_rdv, delai_label):
    type_label = "en teleconsultation" if type_rdv == "video" else "en presentiel"
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">Rappel de rendez-vous</h1>
        </div>
        <div style="padding: 28px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <p>Bonjour {prenom} {nom},</p>
            <p>
                Ceci est un rappel : vous avez un rendez-vous <strong>{delai_label}</strong>
                avec <strong>{interlocuteur}</strong>, {type_label}.
            </p>
            <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 4px 0;"><strong>Date :</strong> {date_str}</p>
                <p style="margin: 4px 0;"><strong>Heure :</strong> {heure_str}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px;">
                Connectez-vous a NERE Health pour consulter les details de votre rendez-vous.
            </p>
        </div>
    </div>
    """


async def _envoyer_rappel(rdv, delai_label, colonne_flag: str, db):
    patient_user = db.get(User, rdv.patient_id)
    medecin_user = db.get(User, rdv.medecin_id) if rdv.medecin_id else None

    if not patient_user or not medecin_user:
        return

    date_str = rdv.date_heure_debut.strftime("%d/%m/%Y")
    heure_str = rdv.date_heure_debut.strftime("%H:%M")

    # --- Notification + email cote patient ---
    notif_patient = Notification(
        utilisateur_id=patient_user.id,
        type="rappel_rdv",
        canal="in_app",
        statut="en_attente",
        titre=f"Rendez-vous {delai_label}",
        contenu=f"Rendez-vous avec Dr. {medecin_user.prenom} {medecin_user.nom} le {date_str} a {heure_str}.",
        donnees_supplementaires={
            "type": "rappel_rdv",
            "rdv_id": str(rdv.id),
            "date": date_str,
            "heure": heure_str,
            "type_rdv": rdv.type,
        },
    )
    db.add(notif_patient)

    corps_patient = _construire_email_rappel(
        patient_user.prenom, patient_user.nom,
        f"Dr. {medecin_user.prenom} {medecin_user.nom}",
        date_str, heure_str, rdv.type, delai_label,
    )
    envoyer_email(patient_user.email, f"Rappel : rendez-vous {delai_label}", corps_patient)

    await manager.send_to_user(str(patient_user.id), {
        "event": "nouvelle_notification",
        "titre": notif_patient.titre,
        "contenu": notif_patient.contenu,
    })

    # --- Notification + email cote medecin ---
    notif_medecin = Notification(
        utilisateur_id=medecin_user.id,
        type="rappel_rdv",
        canal="in_app",
        statut="en_attente",
        titre=f"Rendez-vous {delai_label}",
        contenu=f"Rendez-vous avec {patient_user.prenom} {patient_user.nom} le {date_str} a {heure_str}.",
        donnees_supplementaires={
            "type": "rappel_rdv",
            "rdv_id": str(rdv.id),
            "date": date_str,
            "heure": heure_str,
            "type_rdv": rdv.type,
        },
    )
    db.add(notif_medecin)

    corps_medecin = _construire_email_rappel(
        medecin_user.prenom, medecin_user.nom,
        f"{patient_user.prenom} {patient_user.nom}",
        date_str, heure_str, rdv.type, delai_label,
    )
    envoyer_email(medecin_user.email, f"Rappel : rendez-vous {delai_label}", corps_medecin)

    await manager.send_to_user(str(medecin_user.id), {
        "event": "nouvelle_notification",
        "titre": notif_medecin.titre,
        "contenu": notif_medecin.contenu,
    })

    setattr(rdv, colonne_flag, True)
    db.commit()


async def verifier_rappels():
    """Verifie toutes les 5 minutes les RDV necessitant un rappel 24h ou 1h avant."""
    db = SessionLocal()
    try:
        maintenant = datetime.now(timezone.utc)

        # --- Rappel 24h ---
        debut_24h = maintenant + timedelta(hours=23, minutes=50)
        fin_24h = maintenant + timedelta(hours=24, minutes=10)
        rdvs_24h = db.query(RendezVous).filter(
            RendezVous.statut == "confirme",
            RendezVous.rappel_24h_envoye == False,
            RendezVous.date_heure_debut >= debut_24h,
            RendezVous.date_heure_debut <= fin_24h,
        ).all()
        for rdv in rdvs_24h:
            try:
                await _envoyer_rappel(rdv, "dans 24 heures", "rappel_24h_envoye", db)
            except Exception as e:
                print(f"[RAPPEL ERROR] RDV {rdv.id} (24h): {e}")

        # --- Rappel 1h ---
        debut_1h = maintenant + timedelta(minutes=50)
        fin_1h = maintenant + timedelta(minutes=70)
        rdvs_1h = db.query(RendezVous).filter(
            RendezVous.statut == "confirme",
            RendezVous.rappel_1h_envoye == False,
            RendezVous.date_heure_debut >= debut_1h,
            RendezVous.date_heure_debut <= fin_1h,
        ).all()
        for rdv in rdvs_1h:
            try:
                await _envoyer_rappel(rdv, "dans 1 heure", "rappel_1h_envoye", db)
            except Exception as e:
                print(f"[RAPPEL ERROR] RDV {rdv.id} (1h): {e}")

    finally:
        db.close()


def demarrer_scheduler():
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(verifier_rappels, "interval", minutes=5, id="verifier_rappels_rdv")
    scheduler.start()
    print("[SCHEDULER] Rappels de rendez-vous actives (verification toutes les 5 min)")
    return scheduler