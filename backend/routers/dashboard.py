import re
from datetime import date
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from auth import get_current_active_user
from db import get_db
from models import Ordonnance, OrdonnanceLigne, PriseMedicament
from timezone import local_today

router = APIRouter(tags=["dashboard"])

FORME_SINGULIER = {
    "comprimes": "comprimé", "gelules": "gélule", "sirop": "sirop",
    "injectable": "injectable", "creme": "crème", "pommade": "pommade",
    "gouttes": "goutte", "suppositoire": "suppositoire", "patch": "patch",
    "inhalateur": "inhalateur", "autre": "dose",
}


class MedicamentDuJour(BaseModel):
    prise_id: UUID
    medicament_nom: str
    dosage: str
    quantite: str
    heure_prevue: str | None = None
    moment_journee: str
    statut: str
    ordonnance_numero: str | None = None


class PrescriptionDuJour(BaseModel):
    ordonnance_id: UUID
    numero: str
    medecin_nom: str | None = None
    statut_traitement: str | None = None
    date_debut_traitement: date | None = None
    date_expiration: date | None = None
    nb_medicaments: int = 0
    nb_prises_prevues: int = 0
    nb_prises_prises: int = 0
    nb_prises_oubliees: int = 0
    progression_pct: float = 0.0


class ResumeJour(BaseModel):
    total_medicaments: int = 0
    total_prises: int = 0
    prises_effectuees: int = 0
    prises_manquees: int = 0
    prises_en_attente: int = 0
    taux_adherence_pct: float = 0.0
    prescriptions_actives: int = 0
    prescriptions_terminees: int = 0
    prescriptions_arretees: int = 0


def _build_quantite(posologie: str | None, dosage: str, forme: str | None) -> str:
    unit = FORME_SINGULIER.get((forme or "").lower(), "dose") if forme else "dose"
    if posologie:
        m = re.search(r'(\d+)\s*(?:comprim|gélul|gelul|ml|mg|g\b|µg|ui|ampoule|sachet|gd)', posologie, re.IGNORECASE)
        if m:
            qty = m.group(1)
            unit_raw = m.group(0)
            if re.search(r'ml|mg|µg|ui|g\b', unit_raw, re.IGNORECASE):
                return unit_raw
            if int(qty) == 1:
                return f"1 {unit}"
            return f"{qty} {unit}s"
        m_num = re.search(r'(\d+)', posologie)
        if m_num:
            qty = int(m_num.group(1))
            if qty == 1:
                return f"1 {unit}"
            return f"{qty} {unit}s"
    return dosage


@router.get("/dashboard/medicaments-du-jour", response_model=List[MedicamentDuJour])
async def medicaments_du_jour(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    today = local_today()
    patient_id = current_user.id

    ordonnance_ids = db.execute(
        select(Ordonnance.id).where(
            Ordonnance.patient_id == patient_id,
            Ordonnance.statut == "active",
            Ordonnance.statut_traitement == "EN_COURS",
        )
    ).scalars().all()

    if not ordonnance_ids:
        return []

    prises = db.execute(
        select(PriseMedicament)
        .where(
            PriseMedicament.ordonnance_id.in_(ordonnance_ids),
            PriseMedicament.date_prise_prevue == today,
        )
        .order_by(PriseMedicament.heure_prise_prevue)
    ).scalars().all()

    results = []
    seen = {}
    for prise in prises:
        key = (prise.ordonnance_id, prise.medicament_nom, prise.heure_prise_prevue)
        if key in seen:
            continue
        seen[key] = True

        ligne = db.execute(
            select(OrdonnanceLigne).where(
                OrdonnanceLigne.ordonnance_id == prise.ordonnance_id,
                OrdonnanceLigne.medicament_nom == prise.medicament_nom,
            ).limit(1)
        ).scalar_one_or_none()

        ordonnance = db.get(Ordonnance, prise.ordonnance_id)

        results.append(MedicamentDuJour(
            prise_id=prise.id,
            medicament_nom=prise.medicament_nom,
            dosage=ligne.dosage if ligne else "",
            quantite=_build_quantite(
                ligne.posologie if ligne else None,
                ligne.dosage if ligne else "",
                ligne.forme if ligne else None,
            ),
            heure_prevue=prise.heure_prise_prevue.strftime("%H:%M") if prise.heure_prise_prevue else None,
            moment_journee=prise.moment_journee,
            statut=prise.statut,
            ordonnance_numero=ordonnance.numero if ordonnance else None,
        ))

    return results


@router.get("/dashboard/prescriptions-du-jour", response_model=List[PrescriptionDuJour])
async def prescriptions_du_jour(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    today = local_today()
    patient_id = current_user.id

    ordonnances = db.execute(
        select(Ordonnance).where(
            Ordonnance.patient_id == patient_id,
            Ordonnance.statut == "active",
            Ordonnance.statut_traitement.notin_(["TERMINE", "ARRETE"]),
        ).order_by(Ordonnance.date_emission.desc())
    ).scalars().all()

    from models import User
    auto_updated = False
    results = []
    for ord in ordonnances:
        prises_today = db.execute(
            select(PriseMedicament).where(
                PriseMedicament.ordonnance_id == ord.id,
                PriseMedicament.date_prise_prevue == today,
            )
        ).scalars().all()

        has_future_or_today = db.execute(
            select(PriseMedicament.id).where(
                PriseMedicament.ordonnance_id == ord.id,
                PriseMedicament.date_prise_prevue >= today,
                PriseMedicament.statut == "A_PRENDRE",
            ).limit(1)
        ).scalar_one_or_none()

        if not has_future_or_today and not prises_today:
            ord.statut_traitement = "TERMINE"
            auto_updated = True
            continue

        nb_prevues = len(prises_today)
        nb_prises = sum(1 for p in prises_today if p.statut == "PRIS")
        nb_oubliees = sum(1 for p in prises_today if p.statut == "OUBLIE")

        if nb_prevues == 0:
            continue

        progression = round((nb_prises / nb_prevues) * 100, 1)

        medecin_user = db.get(User, ord.medecin_id) if ord.medecin_id else None
        medecin_nom = None
        if medecin_user:
            medecin_nom = f"{medecin_user.prenom or ''} {medecin_user.nom or ''}".strip()
        if not medecin_nom and ord.medecin_nom_libre:
            medecin_nom = ord.medecin_nom_libre

        results.append(PrescriptionDuJour(
            ordonnance_id=ord.id,
            numero=ord.numero,
            medecin_nom=medecin_nom,
            statut_traitement=ord.statut_traitement,
            date_debut_traitement=ord.date_debut_traitement,
            date_expiration=ord.date_expiration,
            nb_medicaments=len(ord.lignes) if ord.lignes else 0,
            nb_prises_prevues=nb_prevues,
            nb_prises_prises=nb_prises,
            nb_prises_oubliees=nb_oubliees,
            progression_pct=progression,
        ))

    if auto_updated:
        db.commit()

    return results


@router.get("/dashboard/resume-jour", response_model=ResumeJour)
async def resume_jour(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    today = local_today()
    patient_id = current_user.id

    ordonnances = db.execute(
        select(Ordonnance).where(
            Ordonnance.patient_id == patient_id,
            Ordonnance.statut == "active",
        )
    ).scalars().all()

    en_cours_ids = [o.id for o in ordonnances if o.statut_traitement == "EN_COURS"]
    termine_ids = [o.id for o in ordonnances if o.statut_traitement == "TERMINE"]
    arrete_ids = [o.id for o in ordonnances if o.statut_traitement == "ARRETE"]

    if en_cours_ids:
        non_pris = db.execute(
            select(PriseMedicament.ordonnance_id)
            .where(
                PriseMedicament.ordonnance_id.in_(en_cours_ids),
                PriseMedicament.statut != "PRIS",
            )
            .distinct()
        ).scalars().all()

        to_termine = [oid for oid in en_cours_ids if oid not in non_pris]
        if to_termine:
            db.query(Ordonnance).filter(Ordonnance.id.in_(to_termine)).update(
                {Ordonnance.statut_traitement: "TERMINE"}, synchronize_session=False
            )
            db.commit()
            termine_ids.extend(to_termine)
            en_cours_ids = [oid for oid in en_cours_ids if oid not in to_termine]

    ord_en_cours = len(en_cours_ids)
    ord_terminees = len(termine_ids)
    ord_arretees = len(arrete_ids)

    active_ids = [o.id for o in ordonnances if o.statut_traitement == "EN_COURS"]
    if not active_ids:
        return ResumeJour(
            prescriptions_actives=ord_en_cours,
            prescriptions_terminees=ord_terminees,
            prescriptions_arretees=ord_arretees,
        )

    prises = db.execute(
        select(PriseMedicament).where(
            PriseMedicament.ordonnance_id.in_(active_ids),
            PriseMedicament.date_prise_prevue == today,
        )
    ).scalars().all()

    total = len(prises)
    prises_effectuees = sum(1 for p in prises if p.statut == "PRIS")
    prises_manquees = sum(1 for p in prises if p.statut == "OUBLIE")
    prises_en_attente = sum(1 for p in prises if p.statut == "A_PRENDRE")

    medications_uniques = len({(p.ordonnance_id, p.medicament_nom) for p in prises})

    taux = 0.0
    if total > 0:
        taux = round((prises_effectuees / total) * 100, 1)

    return ResumeJour(
        total_medicaments=medications_uniques,
        total_prises=total,
        prises_effectuees=prises_effectuees,
        prises_manquees=prises_manquees,
        prises_en_attente=prises_en_attente,
        taux_adherence_pct=taux,
        prescriptions_actives=ord_en_cours,
        prescriptions_terminees=ord_terminees,
        prescriptions_arretees=ord_arretees,
    )
