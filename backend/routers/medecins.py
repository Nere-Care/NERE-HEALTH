import os
import secrets
import shutil
import string
import logging
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, case
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from auth import get_current_active_user, get_password_hash, require_role
from db import get_db
from email_service import send_account_activated_email
from models import Avis, Consultation, Medecin, MedecinSpecialite, Notification, Paiement, Patient, RendezVous, Specialite, Structure, User
from schemas import AdminMedecinCreate, AdminMedecinRead, DocumentStructureCreate, MedecinCreate, MedecinRead, MedecinUpdate
from validators import validate_phone
from services.currency_rates import get_rates
from timezone import to_local, DEFAULT_TZ, resolve_tz

UPLOAD_DIR = "uploads/documents"

router = APIRouter(tags=["medecins"])

logger = logging.getLogger(__name__)



@router.get("/medecins", response_model=List[MedecinRead])
async def list_medecins(
    current_user=Depends(get_current_active_user),
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
):
    if current_user.role in ("medecin", "infirmier", "sage_femme", "patient"):
        stmt = (
            select(Medecin, User.prenom, User.nom, User.email, User.telephone, User.photo_url, User.date_naissance)
            .join(User, Medecin.id == User.id)
            .where(User.statut != "banni")
            .where(Medecin.statut_verification == "verifie")
            .limit(limit)
        )
    elif current_user.role == "admin":
        stmt = (
            select(Medecin, User.prenom, User.nom, User.email, User.telephone, User.photo_url, User.date_naissance)
            .join(User, Medecin.id == User.id)
            .limit(limit)
        )
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    rows = db.execute(stmt).all()
    results = []
    for row in rows:
        medecin = row[0]
        medecin_data = {c.key: getattr(medecin, c.key) for c in medecin.__table__.columns}
        medecin_data["prenom"] = row[1]
        medecin_data["nom"] = row[2]
        medecin_data["email"] = row[3]
        medecin_data["telephone"] = row[4]
        medecin_data["photo_url"] = row[5]
        user_dob = row[6]
        medecin_data["date_naissance"] = user_dob.isoformat() if user_dob else None
        medecin_data["age"] = _calculate_age(user_dob) if user_dob else None
        results.append(medecin_data)
    return results


@router.post("/admin/medecins", response_model=AdminMedecinRead, status_code=status.HTTP_201_CREATED)
async def create_medecin_admin(
    data: AdminMedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    full_name = data.name.strip()
    for prefix in ["Dr.", "Dr ", "Pr.", "Pr ", "Prof.", "Prof "]:
        if full_name.startswith(prefix):
            full_name = full_name[len(prefix):].strip()
            break
    name_parts = full_name.split(" ", 1)
    prenom = name_parts[0] if name_parts[0] else full_name
    nom = name_parts[1] if len(name_parts) > 1 else ""
    if not prenom:
        prenom = full_name

    password_chars = string.ascii_letters + string.digits
    generated_password = "".join(secrets.choice(password_chars) for _ in range(12))
    hashed = get_password_hash(generated_password)

    dob = None
    if data.date_naissance:
        try:
            dob = datetime.strptime(data.date_naissance, "%Y-%m-%d").date()
        except ValueError:
            pass

    user = User(
        email=data.email,
        prenom=prenom,
        nom=nom,
        telephone=data.phone,
        mot_de_passe_hash=hashed,
        role=data.role or "medecin",
        statut="actif",
        date_naissance=dob,
    )
    db.add(user)
    db.flush()

    numero_ordre = data.numero_ordre or f"ORD-{secrets.token_hex(4).upper()}"

    structure_id = None
    if data.hospital:
        structure = db.query(Structure).filter(Structure.nom_etablissement.ilike(f"%{data.hospital}%")).first()
        if structure:
            structure_id = structure.id

    medecin = Medecin(
        id=user.id,
        code_medecin=f"MED-{secrets.token_hex(4).upper()}",
        numero_ordre=numero_ordre,
        structure_id=structure_id,
        annees_experience=data.annees_experience or 0,
    )
    if data.address:
        user.adresse = data.address
    db.add(medecin)

    if data.specialty:
        specialty_obj = db.query(Specialite).filter(
            Specialite.libelle_fr.ilike(f"%{data.specialty}%")
        ).first()
        if not specialty_obj:
            specialty_obj = Specialite(code=data.specialty[:30], libelle_fr=data.specialty)
            db.add(specialty_obj)
            db.flush()
        med_spec = MedecinSpecialite(medecin_id=medecin.id, specialite_id=specialty_obj.id)
        db.add(med_spec)

    if structure_id:
        from routers.structures import sync_structure_professionnel_count
        sync_structure_professionnel_count(db, structure_id)

    try:
        db.commit()
        db.refresh(user)
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erreur de création du médecin") from exc

    return AdminMedecinRead(
        id=user.id,
        email=user.email,
        prenom=user.prenom,
        nom=user.nom,
        telephone=user.telephone,
        mot_de_passe_genere=generated_password,
        medecin_id=medecin.id,
        numero_ordre=medecin.numero_ordre,
    )


@router.post("/medecins", response_model=MedecinRead, status_code=status.HTTP_201_CREATED)
async def create_medecin(
    medecin_create: MedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.get(User, medecin_create.id)
    if not user or user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur médecin introuvable")

    medecin = Medecin(**medecin_create.dict(exclude_unset=True))
    db.add(medecin)
    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du médecin") from exc
    return medecin


def _calculate_age(birth_date):
    if not birth_date:
        return None
    today = datetime.now(timezone.utc).date()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


@router.get("/medecins/dashboard")
async def get_medecin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    medecin_id = current_user.id
    medecin_profile = db.get(Medecin, medecin_id)
    devise = medecin_profile.devise if medecin_profile else "XAF"
    user_tz_name = getattr(current_user, "timezone", None) or DEFAULT_TZ
    now_local = datetime.now(timezone.utc).astimezone(resolve_tz(user_tz_name))
    today_start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    today_start = today_start_local.astimezone(timezone.utc)
    today_end = today_start + timedelta(days=1)
    week_ago = today_start - timedelta(days=7)
    four_months_ago = today_start - timedelta(days=120)

    # 1. Consultations du jour
    consultations_today = (
        db.query(Consultation)
        .filter(
            Consultation.medecin_id == medecin_id,
            Consultation.date_heure_debut >= today_start,
            Consultation.date_heure_debut < today_end,
        )
        .all()
    )
    consultations_aujourdhui = sum(1 for c in consultations_today if c.statut == "en_cours")
    consultations_terminees = sum(1 for c in consultations_today if c.statut == "termine")

    # 2. Revenu journalier (normalize to XAF for aggregation using live rates)
    _rates = get_rates()
    _xaf_rate = case(
        (Paiement.devise == "EUR", _rates.get("EUR", 656)),
        (Paiement.devise == "USD", _rates.get("USD", 576)),
        (Paiement.devise == "GBP", _rates.get("GBP", 768)),
        (Paiement.devise == "XOF", _rates.get("XOF", 1)),
        else_=_rates.get("XAF", 1),
    )
    revenue_today = (
        db.query(func.coalesce(func.sum(Paiement.montant_medecin * _xaf_rate), 0))
        .filter(
            Paiement.medecin_id == medecin_id,
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.created_at >= today_start,
            Paiement.created_at < today_end,
        )
        .scalar()
    ) or 0

    yesterday_start = today_start - timedelta(days=1)
    revenue_yesterday = (
        db.query(func.coalesce(func.sum(Paiement.montant_medecin * _xaf_rate), 0))
        .filter(
            Paiement.medecin_id == medecin_id,
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.created_at >= yesterday_start,
            Paiement.created_at < today_start,
        )
        .scalar()
    ) or 0

    # 3. Satisfaction
    avg_note = (
        db.query(func.coalesce(func.avg(Avis.note), 0))
        .filter(Avis.medecin_id == medecin_id)
        .scalar()
    ) or 0
    satisfaction = round(float(avg_note) / 5 * 100) if float(avg_note) > 0 else 0

    # 4. Revenu hebdomadaire (normalize to XAF)
    daily_revenue = (
        db.query(
            func.date(Paiement.created_at).label("day"),
            func.coalesce(func.sum(Paiement.montant_medecin * _xaf_rate), 0).label("amount"),
        )
        .filter(
            Paiement.medecin_id == medecin_id,
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.created_at >= week_ago,
        )
        .group_by(func.date(Paiement.created_at))
        .order_by(func.date(Paiement.created_at))
        .all()
    )
    DAYS_FR = {0: "Lun", 1: "Mar", 2: "Mer", 3: "Jeu", 4: "Ven", 5: "Sam", 6: "Dim"}
    revenue_by_day = {}
    for r in daily_revenue:
        revenue_by_day[str(r.day)] = float(r.amount)
    revenue_hebdo = []
    for i in range(8):
        d = (today_start_local - timedelta(days=7 - i)).date()
        day_label = f"{DAYS_FR[d.weekday()]} {d.day}"
        revenue_hebdo.append({
            "day": day_label,
            "amount": revenue_by_day.get(d.strftime("%Y-%m-%d"), 0),
        })

    # 5. Consultations mensuelles (4 derniers mois) — fallback sur RDV si pas de consultations
    monthly_consultations = (
        db.query(
            func.date_trunc("month", Consultation.date_heure_debut).label("month"),
            func.count(Consultation.id).label("total"),
        )
        .filter(
            Consultation.medecin_id == medecin_id,
            Consultation.date_heure_debut >= four_months_ago,
        )
        .group_by(func.date_trunc("month", Consultation.date_heure_debut))
        .order_by(func.date_trunc("month", Consultation.date_heure_debut))
        .all()
    )
    MONTHS_FR = {1: "Jan", 2: "Fév", 3: "Mar", 4: "Avr", 5: "Mai", 6: "Juin",
                  7: "Juil", 8: "Aoû", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Déc"}
    consultations_mensuelles = [
        {"month": MONTHS_FR[r.month.month], "total": r.total}
        for r in monthly_consultations
    ]

    # 6. Rendez-vous du jour (RDV à venir — uniquement ceux dont l'heure est future + 45 min min)
    rdv_all_today = (
        db.query(RendezVous)
        .filter(
            RendezVous.medecin_id == medecin_id,
            RendezVous.date_heure_debut >= today_start,
            RendezVous.date_heure_debut < today_end,
            RendezVous.statut.in_(["confirme", "en_cours"]),
        )
        .order_by(RendezVous.date_heure_debut)
        .all()
    )
    rdv_avenir_threshold = now_local + timedelta(minutes=45)
    rdv_avenir_threshold_utc = rdv_avenir_threshold.astimezone(timezone.utc)

    rdv_aujourdhui = []
    for r in rdv_all_today:
        rdv_start = r.date_heure_debut
        if rdv_start.tzinfo is None:
            rdv_start = rdv_start.replace(tzinfo=timezone.utc)
        is_future_enough = rdv_start >= rdv_avenir_threshold_utc
        has_consultation = (
            db.query(Consultation)
            .filter(Consultation.rdv_id == r.id, Consultation.statut.in_(["en_cours", "termine"]))
            .first()
            is not None
        )
        if is_future_enough or has_consultation:
            patient_user = db.get(User, r.patient_id)
            patient_name = f"{patient_user.prenom or ''} {patient_user.nom or ''}".strip() or "Patient"
            type_label = "Téléconsultation" if r.type != "presentiel" else "Consultation"
            rdv_aujourdhui.append({
                "time": to_local(r.date_heure_debut, user_tz_name).strftime("%H:%M") if r.date_heure_debut else "",
                "patient": patient_name,
                "type": type_label,
                "clinic": "En ligne" if r.type != "presentiel" else "Cabinet",
                "reason": r.motif_consultation or "Consultation générale",
                "notes_patient": r.notes_patient or "",
                "motif_consultation": r.motif_consultation or "",
            })

    # Nombre de RDV hier (pour calcul de croissance)
    yesterday_start = today_start - timedelta(days=1)
    yesterday_end = today_start
    rdv_yesterday_count = (
        db.query(func.count(RendezVous.id))
        .filter(
            RendezVous.medecin_id == medecin_id,
            RendezVous.date_heure_debut >= yesterday_start,
            RendezVous.date_heure_debut < yesterday_end,
            RendezVous.statut.in_(["confirme", "en_cours", "termine"]),
        )
        .scalar()
    ) or 0
    rdv_today_total = (
        db.query(func.count(RendezVous.id))
        .filter(
            RendezVous.medecin_id == medecin_id,
            RendezVous.date_heure_debut >= today_start,
            RendezVous.date_heure_debut < today_end,
            RendezVous.statut.in_(["confirme", "en_cours", "termine"]),
        )
        .scalar()
    ) or 0
    consultations_yesterday_count = (
        db.query(func.count(Consultation.id))
        .filter(
            Consultation.medecin_id == medecin_id,
            Consultation.date_heure_debut >= yesterday_start,
            Consultation.date_heure_debut < yesterday_end,
        )
        .scalar()
    ) or 0
    consultations_today_total = (
        db.query(func.count(Consultation.id))
        .filter(
            Consultation.medecin_id == medecin_id,
            Consultation.date_heure_debut >= today_start,
            Consultation.date_heure_debut < today_end,
        )
        .scalar()
    ) or 0

    def _growth_pct(current, previous):
        if previous == 0:
            return "+100%" if current > 0 else "+0%"
        pct = round(((current - previous) / previous) * 100)
        return f"+{pct}%" if pct >= 0 else f"{pct}%"

    # 7. Patients récents (depuis consultations OU rendez-vous)
    recent_consultations = (
        db.query(Consultation)
        .filter(Consultation.medecin_id == medecin_id)
        .order_by(Consultation.date_heure_debut.desc())
        .limit(20)
        .all()
    )
    seen_patient_ids = set()
    patient_ids_in_order = []
    patient_has_consultation = {}
    for c in recent_consultations:
        if c.patient_id not in seen_patient_ids:
            seen_patient_ids.add(c.patient_id)
            patient_ids_in_order.append(c.patient_id)
            patient_has_consultation[c.patient_id] = True

    if not patient_ids_in_order:
        recent_rdv = (
            db.query(RendezVous)
            .filter(RendezVous.medecin_id == medecin_id)
            .order_by(RendezVous.date_heure_debut.desc())
            .limit(20)
            .all()
        )
        for r in recent_rdv:
            if r.patient_id not in seen_patient_ids:
                seen_patient_ids.add(r.patient_id)
                patient_ids_in_order.append(r.patient_id)
                patient_has_consultation[r.patient_id] = False

    patients_recents = []
    if patient_ids_in_order:
        patients_map = {p.id: p for p in db.query(Patient).filter(Patient.id.in_(patient_ids_in_order)).all()}
        user_ids = list(patients_map.keys())
        users_map = {}
        if user_ids:
            for u in db.query(User).filter(User.id.in_(user_ids)).all():
                users_map[u.id] = u
        for pid in patient_ids_in_order[:6]:
            p = patients_map.get(pid)
            if not p:
                continue
            u = users_map.get(pid)
            name = f"{u.prenom or ''} {u.nom or ''}".strip() or "Patient"
            patients_recents.append({
                "name": name,
                "age": _calculate_age(u.date_naissance) or 0,
                "consultation_effective": patient_has_consultation.get(pid, False),
            })

    # 8. Notifications (non lues uniquement pour le dashboard)
    notifs = (
        db.query(Notification)
        .filter(
            Notification.utilisateur_id == medecin_id,
            Notification.statut != "lu",
            Notification.canal == "in_app",
        )
        .order_by(Notification.created_at.desc())
        .limit(10)
        .all()
    )
    notifications = [
        {
            "titre": n.titre,
            "contenu": n.contenu,
            "type": n.type,
            "date": n.created_at.isoformat() if n.created_at else "",
        }
        for n in notifs
    ]

    return {
        "stats": [
            {"title": "RDV à venir", "value": len(rdv_aujourdhui),
             "subtitle": "Aujourd'hui", "growth": _growth_pct(rdv_today_total, rdv_yesterday_count),
             "color": "green"},
            {"title": "Consultations terminées", "value": consultations_terminees,
             "subtitle": "Aujourd'hui", "growth": _growth_pct(consultations_today_total, consultations_yesterday_count),
             "color": "blue"},
            {"title": "Revenu journalier",
             "value": revenue_today,
             "subtitle": "Aujourd'hui", "growth": _growth_pct(revenue_today, revenue_yesterday),
             "color": "purple"},
            {"title": "Satisfaction patients", "value": f"{satisfaction}%",
             "subtitle": "Moyenne globale", "growth": "+0%",
             "color": "orange"},
        ],
        "devise": devise,
        "revenue_hebdomadaire": revenue_hebdo,
        "consultations_mensuelles": consultations_mensuelles,
        "rendez_vous_aujourdhui": rdv_aujourdhui,
        "patients_recents": patients_recents,
        "notifications": notifications,
    }


@router.get("/medecins/{medecin_id}", response_model=MedecinRead)
async def read_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    user = db.get(User, medecin_id)
    if user and user.statut == "banni":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")

    if current_user.role != "admin" and medecin.statut_verification != "verifie" and current_user.id != medecin.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")

    if current_user.role == "patient":
        pass
    elif current_user.role == "admin":
        pass
    elif current_user.role in ("medecin", "infirmier", "sage_femme"):
        if medecin.id != current_user.id and medecin.statut_verification != "verifie":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if user and user.statut == "suspendu":
        medecin.disponible_maintenant = False

    return medecin


@router.put("/medecins/{medecin_id}", response_model=MedecinRead)
async def update_medecin(
    medecin_id: UUID,
    medecin_update: MedecinUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and medecin.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    update_data = medecin_update.dict(exclude_unset=True)

    # Handle telephone/email/address/date_naissance/name on the User record
    user = db.get(User, medecin_id)
    if "date_naissance" in update_data and user:
        val = update_data.pop("date_naissance")
        if val:
            try:
                user.date_naissance = datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                pass
        else:
            user.date_naissance = None

    if "telephone" in update_data and update_data["telephone"] and user:
        try:
            update_data["telephone"] = validate_phone(update_data["telephone"])
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    for user_field in ("telephone", "email", "prenom", "nom"):
        if user_field in update_data and user:
            setattr(user, user_field, update_data.pop(user_field))
    if "address" in update_data and user:
        user.adresse = update_data.pop("address")

    # Handle specialite update
    if "specialite" in update_data and update_data["specialite"]:
        spec = db.query(Specialite).filter(Specialite.libelle_fr.ilike(f"%{update_data['specialite']}%")).first()
        if not spec:
            spec = Specialite(code=update_data["specialite"][:30], libelle_fr=update_data["specialite"])
            db.add(spec)
            db.flush()
        # Remove existing specialty links
        db.query(MedecinSpecialite).filter(MedecinSpecialite.medecin_id == medecin_id).delete()
        db.add(MedecinSpecialite(medecin_id=medecin_id, specialite_id=spec.id))
        del update_data["specialite"]

    # Handle hopital/structure update
    old_structure_id = medecin.structure_id
    if "hopital" in update_data and update_data["hopital"]:
        structure = db.query(Structure).filter(Structure.nom_etablissement.ilike(f"%{update_data['hopital']}%")).first()
        if structure:
            if current_user.role == "medecin" and structure.id != old_structure_id:
                pending = {"structure_id": str(structure.id), "structure_nom": structure.nom_etablissement, "statut": "en_attente", "date_demande": datetime.now(timezone.utc).isoformat()}
                medecin.structure_modification = pending
                flag_modified(medecin, "structure_modification")
            elif current_user.role == "admin":
                medecin.structure_id = structure.id
        del update_data["hopital"]

    if "structure_id" in update_data:
        new_structure_id = update_data.pop("structure_id")
        if new_structure_id and str(new_structure_id) != str(old_structure_id or ""):
            if current_user.role == "medecin":
                structure = db.get(Structure, new_structure_id)
                pending = {"structure_id": str(new_structure_id), "structure_nom": structure.nom_etablissement if structure else "", "statut": "en_attente", "date_demande": datetime.now(timezone.utc).isoformat()}
                medecin.structure_modification = pending
                flag_modified(medecin, "structure_modification")
            else:
                medecin.structure_id = new_structure_id
        elif not new_structure_id and old_structure_id:
            if current_user.role == "medecin":
                pending = {"structure_id": None, "structure_nom": None, "statut": "en_attente", "date_demande": datetime.now(timezone.utc).isoformat()}
                medecin.structure_modification = pending
                flag_modified(medecin, "structure_modification")
            else:
                medecin.structure_id = None

    # Tariff change: doctors store as pending, admins apply directly
    tarif_keys = ("tarif_consultation", "devise")
    if current_user.role == "medecin" and any(k in update_data for k in tarif_keys):
        def _to_float(v):
            try:
                return float(v)
            except (TypeError, ValueError):
                return v

        has_real_change = False
        for k in tarif_keys:
            if k in update_data:
                val = _to_float(update_data[k])
                current_val = _to_float(getattr(medecin, k, None))
                if val != current_val:
                    has_real_change = True
                    break
        if has_real_change:
            pending = dict(medecin.tarif_modification) if medecin.tarif_modification else {}
            for k in tarif_keys:
                if k in update_data:
                    val = update_data.pop(k)
                    if isinstance(val, Decimal):
                        val = float(val)
                    pending[k] = val
            pending["statut"] = "en_attente"
            pending["date_demande"] = datetime.now(timezone.utc).isoformat()
            medecin.tarif_modification = pending
            flag_modified(medecin, "tarif_modification")
        else:
            for k in tarif_keys:
                update_data.pop(k, None)

    for field, value in update_data.items():
        setattr(medecin, field, value)

    if current_user.role in ("medecin", "admin") and medecin.tarif_modification and medecin.tarif_modification.get("statut") == "en_attente":
        def _to_float(v):
            try:
                return float(v)
            except (TypeError, ValueError):
                return v

        all_match = all(
            _to_float(medecin.tarif_modification.get(k)) == _to_float(getattr(medecin, k, None))
            for k in tarif_keys if medecin.tarif_modification.get(k) is not None
        )
        if all_match:
            medecin.tarif_modification = None
            flag_modified(medecin, "tarif_modification")

    if current_user.role in ("medecin", "admin") and medecin.structure_modification and medecin.structure_modification.get("statut") == "en_attente":
        pending_sid = medecin.structure_modification.get("structure_id")
        if str(pending_sid or "") == str(medecin.structure_id or ""):
            medecin.structure_modification = None
            flag_modified(medecin, "structure_modification")

    db.add(medecin)
    db.flush()

    if medecin.structure_id != old_structure_id:
        from routers.structures import sync_structure_professionnel_count
        sync_structure_professionnel_count(db, old_structure_id, medecin.structure_id)

    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour du médecin: {exc.orig}") from exc
    return medecin


@router.delete("/medecins/{medecin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    old_structure_id = medecin.structure_id
    user = db.get(User, medecin_id)
    if user:
        user.statut = "supprime"
        db.add(user)
    db.delete(medecin)
    if old_structure_id:
        from routers.structures import sync_structure_professionnel_count
        sync_structure_professionnel_count(db, old_structure_id)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/medecins/{medecin_id}/documents", response_model=MedecinRead)
async def add_medecin_document(
    medecin_id: UUID,
    document: DocumentStructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and current_user.id != medecin_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez modifier que vos propres documents")

    docs = list(medecin.documents or [])
    docs.append({"nom": document.nom, "type": document.type, "taille": document.taille, "url": document.url})
    medecin.documents = docs

    db.add(medecin)
    db.commit()
    db.refresh(medecin)
    return medecin


@router.delete("/medecins/{medecin_id}/documents/{doc_index}", response_model=MedecinRead)
async def remove_medecin_document(
    medecin_id: UUID,
    doc_index: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and current_user.id != medecin_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez modifier que vos propres documents")

    docs = list(medecin.documents or [])
    if doc_index < 0 or doc_index >= len(docs):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Index de document invalide")

    removed = docs.pop(doc_index)
    medecin.documents = docs

    # Delete file from disk if it's a local upload
    if removed.get("url", "").startswith("/uploads/"):
        file_path = removed["url"].lstrip("/")
        if os.path.isfile(file_path):
            os.remove(file_path)

    db.add(medecin)
    db.commit()
    db.refresh(medecin)
    return medecin


@router.post("/medecins/{medecin_id}/documents/upload", response_model=MedecinRead)
async def upload_medecin_document(
    medecin_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and current_user.id != medecin_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez modifier que vos propres documents")

    dest_dir = os.path.join(UPLOAD_DIR, str(medecin_id))
    os.makedirs(dest_dir, exist_ok=True)

    safe_name = f"{secrets.token_hex(8)}_{file.filename}"
    dest_path = os.path.join(dest_dir, safe_name)

    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(dest_path)
    file_type = file.content_type or "application/octet-stream"
    url = f"/uploads/documents/{medecin_id}/{safe_name}"

    docs = list(medecin.documents or [])
    docs.append({
        "nom": file.filename or safe_name,
        "type": file_type,
        "taille": f"{file_size / 1024:.1f} Ko",
        "url": url,
    })
    medecin.documents = docs

    db.add(medecin)
    db.commit()
    db.refresh(medecin)
    return medecin


@router.post("/medecins/{medecin_id}/documents/public-upload", response_model=MedecinRead)
async def public_upload_medecin_document(
    medecin_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Permet de joindre des documents (pièce d'identité, diplôme) lors de l'inscription."""
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")

    dest_dir = os.path.join(UPLOAD_DIR, str(medecin_id))
    os.makedirs(dest_dir, exist_ok=True)

    safe_name = f"{secrets.token_hex(8)}_{file.filename}"
    dest_path = os.path.join(dest_dir, safe_name)

    with open(dest_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    file_size = os.path.getsize(dest_path)
    file_type = file.content_type or "application/octet-stream"
    url = f"/uploads/documents/{medecin_id}/{safe_name}"

    docs = list(medecin.documents or [])
    docs.append({
        "nom": file.filename or safe_name,
        "type": file_type,
        "taille": f"{file_size / 1024:.1f} Ko",
        "url": url,
    })
    medecin.documents = docs
    flag_modified(medecin, "documents")

    db.add(medecin)
    db.commit()
    db.refresh(medecin)
    return medecin


@router.put("/medecins/{medecin_id}/disponibilite")
async def toggle_disponibilite(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin", "admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and current_user.id != medecin_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez modifier que votre propre statut")

    medecin.disponible_maintenant = not medecin.disponible_maintenant
    db.add(medecin)
    db.commit()
    db.refresh(medecin)
    return {"disponible_maintenant": medecin.disponible_maintenant}


@router.put("/admin/medecins/{medecin_id}/status")
async def update_medecin_status(
    medecin_id: UUID,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.get(User, medecin_id)
    if not user or user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")

    new_status = status_data.get("statut")
    if new_status not in ("actif", "suspendu", "banni", "inactif"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")

    was_actif = user.statut == "actif"
    user.statut = new_status
    db.add(user)
    db.commit()
    db.refresh(user)

    if new_status == "actif" and not was_actif:
        try:
            send_account_activated_email(user.email, user.prenom)
        except Exception as exc:
            logger.warning("Échec de l'envoi de l'email d'activation à %s : %s", user.email, exc)

    return {"statut": user.statut}


PROFILE_DOCS_DIR = "uploads/profile_docs"


@router.post("/medecins/{medecin_id}/profile-docs/upload")
async def upload_profile_doc(
    medecin_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin") or (
        current_user.role == "medecin" and current_user.id != medecin_id
    ):
        raise HTTPException(status_code=403, detail="Accès refusé")

    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    dest_dir = os.path.join(PROFILE_DOCS_DIR, str(medecin_id))
    os.makedirs(dest_dir, exist_ok=True)

    safe_name = f"{secrets.token_hex(8)}_{file.filename}"
    dest_path = os.path.join(dest_dir, safe_name)

    with open(dest_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    file_size = os.path.getsize(dest_path)
    url = f"/uploads/profile_docs/{medecin_id}/{safe_name}"

    return {
        "url": url,
        "nom": file.filename or safe_name,
        "type": file.content_type or "application/octet-stream",
        "taille": f"{file_size / 1024:.1f} Ko",
    }


@router.get("/medecins/{medecin_id}/pending-changes")
async def get_pending_changes(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    results = {}
    for field_name in ("diplomes", "certifications", "experience_history"):
        items = getattr(medecin, field_name, []) or []
        pending = [
            {"index": i, **item}
            for i, item in enumerate(items)
            if isinstance(item, dict) and item.get("statut") == "en_attente"
        ]
        if pending:
            results[field_name] = pending

    mod = medecin.tarif_modification
    if isinstance(mod, dict) and mod.get("statut") == "en_attente":
        results["tarif_modification"] = [{"index": 0, **mod}]

    return results


@router.put("/medecins/{medecin_id}/validate-change")
async def validate_change(
    medecin_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    field_name = body.get("field")
    index = body.get("index")
    action = body.get("action")

    if field_name not in ("diplomes", "certifications", "experience_history"):
        raise HTTPException(status_code=400, detail="Champ invalide")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action invalide")

    items = list(getattr(medecin, field_name, []) or [])
    if index is None or index < 0 or index >= len(items):
        raise HTTPException(status_code=400, detail="Index invalide")

    new_statut = "valide" if action == "approve" else "rejete"
    items[index]["statut"] = new_statut
    setattr(medecin, field_name, items)
    flag_modified(medecin, field_name)  # force SQLAlchemy to detect JSONB mutation

    db.add(medecin)
    db.commit()
    return {"ok": True, "statut": new_statut}


@router.get("/admin/medecins/pending-profile-changes")
async def get_all_pending(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    all_medecins = db.query(Medecin).all()
    results = []
    for m in all_medecins:
        for field_name in ("diplomes", "certifications", "experience_history"):
            items = getattr(m, field_name, []) or []
            for i, item in enumerate(items):
                if isinstance(item, dict) and item.get("statut") == "en_attente":
                    user = db.get(User, m.id)
                    results.append({
                        "medecin_id": str(m.id),
                        "medecin_nom": f"{user.prenom or ''} {user.nom or ''}".strip() if user else "",
                        "field": field_name,
                        "index": i,
                        "item": item,
                    })
        mod = m.tarif_modification
        if isinstance(mod, dict) and mod.get("statut") == "en_attente":
            user = db.get(User, m.id)
            results.append({
                "medecin_id": str(m.id),
                "medecin_nom": f"{user.prenom or ''} {user.nom or ''}".strip() if user else "",
                "field": "tarif_modification",
                "index": 0,
                "item": mod,
            })
        smod = m.structure_modification
        if isinstance(smod, dict) and smod.get("statut") == "en_attente":
            user = db.get(User, m.id)
            results.append({
                "medecin_id": str(m.id),
                "medecin_nom": f"{user.prenom or ''} {user.nom or ''}".strip() if user else "",
                "field": "structure_modification",
                "index": 0,
                "item": smod,
            })
    return results


@router.put("/medecins/{medecin_id}/validate-tarif")
async def validate_tarif(
    medecin_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    action = body.get("action")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action invalide")

    mod = medecin.tarif_modification
    if not isinstance(mod, dict) or mod.get("statut") != "en_attente":
        raise HTTPException(status_code=400, detail="Aucune modification de tarif en attente")

    if action == "approve":
        if "tarif_consultation" in mod:
            medecin.tarif_consultation = mod["tarif_consultation"]
        if "devise" in mod:
            medecin.devise = mod["devise"]

    medecin.tarif_modification = None
    flag_modified(medecin, "tarif_modification")
    flag_modified(medecin, "tarif_consultation")
    flag_modified(medecin, "devise")

    db.add(medecin)
    db.commit()
    return {"ok": True, "action": action}


@router.put("/medecins/{medecin_id}/validate-structure")
async def validate_structure(
    medecin_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    action = body.get("action")
    if action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action invalide")

    mod = medecin.structure_modification
    if not isinstance(mod, dict) or mod.get("statut") != "en_attente":
        raise HTTPException(status_code=400, detail="Aucune modification de structure en attente")

    old_structure_id = medecin.structure_id

    if action == "approve":
        new_sid = mod.get("structure_id")
        medecin.structure_id = UUID(new_sid) if new_sid else None

    medecin.structure_modification = None
    flag_modified(medecin, "structure_modification")
    flag_modified(medecin, "structure_id")

    if medecin.structure_id != old_structure_id:
        from routers.structures import sync_structure_professionnel_count
        sync_structure_professionnel_count(db, old_structure_id, medecin.structure_id)

    db.add(medecin)
    db.commit()
    return {"ok": True, "action": action}


@router.get("/medecins/{medecin_id}/methodes-retrait")
async def get_methodes_retrait(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    if current_user.role != "admin" and current_user.id != medecin_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return {"methodes": medecin.methodes_retrait or []}


@router.put("/medecins/{medecin_id}/methodes-retrait")
async def update_methodes_retrait(
    medecin_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")
    if current_user.role != "admin" and current_user.id != medecin_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    medecin.methodes_retrait = body.get("methodes", [])
    flag_modified(medecin, "methodes_retrait")
    db.add(medecin)
    db.commit()
    return {"ok": True, "methodes": medecin.methodes_retrait}
