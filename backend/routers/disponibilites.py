from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Disponibilite, ExceptionDisponibilite, RendezVous, User
from schemas import DisponibiliteCreate, DisponibiliteRead
from timezone import to_local, DEFAULT_TZ

router = APIRouter(tags=["disponibilites"])


@router.get("/disponibilites", response_model=List[DisponibiliteRead])
async def list_disponibilites(
    medecin_id: Optional[UUID] = None,
    jour_semaine: Optional[str] = None,
    actif: Optional[bool] = None,
    limit: int = Query(200, gt=0, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin", "infirmier", "sage_femme"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    stmt = select(Disponibilite)
    if current_user.role in ("medecin", "infirmier", "sage_femme"):
        stmt = stmt.where(Disponibilite.medecin_id == current_user.id)
    if medecin_id:
        stmt = stmt.where(Disponibilite.medecin_id == medecin_id)
    if jour_semaine:
        stmt = stmt.where(Disponibilite.jour_semaine == jour_semaine)
    if actif is not None:
        stmt = stmt.where(Disponibilite.actif == actif)

    disponibilites = db.execute(stmt.order_by(Disponibilite.date_debut_validite.desc()).limit(limit)).scalars().all()
    return disponibilites


@router.post("/disponibilites", response_model=DisponibiliteRead, status_code=status.HTTP_201_CREATED)
async def create_disponibilite(
    disponibilite_create: DisponibiliteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if current_user.role == "medecin":
        disponibilite_create.medecin_id = current_user.id
    if current_user.role == "admin" and not disponibilite_create.medecin_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin requis pour la disponibilité")
    if not db.get(User, disponibilite_create.medecin_id) or db.get(User, disponibilite_create.medecin_id).role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    disponibilite = Disponibilite(**disponibilite_create.dict(exclude_unset=True))
    db.add(disponibilite)
    try:
        db.commit()
        db.refresh(disponibilite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la disponibilité") from exc
    return disponibilite


@router.get("/disponibilites/{disponibilite_id}", response_model=DisponibiliteRead)
async def read_disponibilite(
    disponibilite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return disponibilite


@router.put("/disponibilites/{disponibilite_id}", response_model=DisponibiliteRead)
async def update_disponibilite(
    disponibilite_id: UUID,
    disponibilite_update: DisponibiliteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if disponibilite_update.medecin_id and current_user.role == "admin":
        medecin = db.get(User, disponibilite_update.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in disponibilite_update.dict(exclude_unset=True).items():
        setattr(disponibilite, field, value)

    db.add(disponibilite)
    try:
        db.commit()
        db.refresh(disponibilite)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la disponibilité: {exc.orig}") from exc
    return disponibilite


@router.delete("/disponibilites/{disponibilite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_disponibilite(
    disponibilite_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    disponibilite = db.get(Disponibilite, disponibilite_id)
    if not disponibilite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilité non trouvée")
    if current_user.role == "medecin" and disponibilite.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(disponibilite)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


DAY_NAME_MAP = {
    0: "lundi",
    1: "mardi",
    2: "mercredi",
    3: "jeudi",
    4: "vendredi",
    5: "samedi",
    6: "dimanche",
}


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _minutes_to_time(m: int) -> time:
    return time(hour=m // 60, minute=m % 60)


def _generate_slots(
    start_minutes: int,
    end_minutes: int,
    slot_duration: int,
    booked_minutes: set[tuple[int, int]],
) -> list[dict]:
    slots = []
    cursor = start_minutes
    while cursor + slot_duration <= end_minutes:
        slot_end = cursor + slot_duration
        overlap = any(
            cursor < be and bs < slot_end for bs, be in booked_minutes
        )
        if not overlap:
            slots.append({
                "start": str(_minutes_to_time(cursor)),
                "end": str(_minutes_to_time(slot_end)),
            })
        cursor += slot_duration
    return slots


@router.get(
    "/disponibilites/creneaux/{medecin_id}",
    response_model=list[dict],
)
async def get_available_slots(
    medecin_id: UUID,
    date_str: str = Query(..., alias="date", description="Date au format YYYY-MM-DD"),
    client_now: Optional[str] = Query(None, alias="now", description="Heure locale client ISO format"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    target_date = date.fromisoformat(date_str)
    weekday = target_date.weekday()
    jour_nom = DAY_NAME_MAP[weekday]

    if not db.get(User, medecin_id) or db.get(User, medecin_id).role != "medecin":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin introuvable")

    medecin_user = db.get(User, medecin_id)
    medecin_tz = getattr(medecin_user, "timezone", None) or DEFAULT_TZ

    exception_stmt = select(ExceptionDisponibilite).where(
        ExceptionDisponibilite.medecin_id == medecin_id,
        ExceptionDisponibilite.date == target_date,
        ExceptionDisponibilite.actif == True,
    )
    exception = db.execute(exception_stmt).scalars().first()

    if exception:
        if exception.type == "indisponible":
            return []
        if exception.type == "horaires_personnalises" and exception.creneaux:
            booked_stmt = select(
                RendezVous.date_heure_debut, RendezVous.date_heure_fin
            ).where(
                RendezVous.medecin_id == medecin_id,
                RendezVous.statut.notin_(["annule_patient", "annule_medecin", "annule_systeme"]),
            )
            booked_raw = db.execute(booked_stmt).all()
            booked_minutes = set()
            for bd, bf in booked_raw:
                bd_local = to_local(bd, medecin_tz)
                bf_local = to_local(bf, medecin_tz)
                if bd_local.date() == target_date:
                    booked_minutes.add((
                        _time_to_minutes(bd_local.time()),
                        _time_to_minutes(bf_local.time()),
                    ))

            available = []
            for cr in exception.creneaux:
                if not cr.get("start") or not cr.get("end"):
                    continue
                cr_start = time.fromisoformat(cr["start"])
                cr_end = time.fromisoformat(cr["end"])
                cr_start_min = _time_to_minutes(cr_start)
                cr_end_min = _time_to_minutes(cr_end)
                slots = _generate_slots(cr_start_min, cr_end_min, 15, booked_minutes)
                available.extend(slots)
            return available

    disp_stmt = select(Disponibilite).where(
        Disponibilite.medecin_id == medecin_id,
        Disponibilite.jour_semaine == jour_nom,
        Disponibilite.actif == True,
    )
    disponibilites = db.execute(disp_stmt).scalars().all()

    now = datetime.fromisoformat(client_now) if client_now else datetime.now(timezone.utc)
    is_today = target_date == now.date()
    today_minutes = now.hour * 60 + now.minute if is_today else 0

    booked_stmt = select(
        RendezVous.date_heure_debut, RendezVous.date_heure_fin
    ).where(
        RendezVous.medecin_id == medecin_id,
        RendezVous.statut.notin_(["annule_patient", "annule_medecin", "annule_systeme"]),
    )
    booked_raw = db.execute(booked_stmt).all()
    booked_minutes: set[tuple[int, int]] = set()
    for bd, bf in booked_raw:
        bd_local = to_local(bd, medecin_tz)
        bf_local = to_local(bf, medecin_tz)
        if bd_local.date() == target_date:
            booked_minutes.add((
                _time_to_minutes(bd_local.time()),
                _time_to_minutes(bf_local.time()),
            ))

    available = []
    for disp in disponibilites:
        if disp.date_debut_validite and target_date < disp.date_debut_validite:
            continue
        if disp.date_fin_validite and target_date > disp.date_fin_validite:
            continue

        if disp.recurrence == "unique":
            if not disp.date_debut_validite:
                continue
            debut = disp.date_debut_validite
            diff = (target_date - debut).days
            if diff < 0 or diff >= 7:
                continue
        elif disp.recurrence == "bi_mensuel":
            if not disp.date_debut_validite:
                continue
            debut = disp.date_debut_validite
            diff_weeks = (target_date - debut).days // 7
            if diff_weeks < 0 or diff_weeks % 2 != 0:
                continue

        slot_duration = 15
        start_min = _time_to_minutes(disp.heure_debut)
        end_min = _time_to_minutes(disp.heure_fin)

        slots = _generate_slots(start_min, end_min, slot_duration, booked_minutes)
        available.extend(slots)

    if is_today:
        available = [s for s in available if _time_to_minutes(time.fromisoformat(s["start"])) >= today_minutes + 30]

    return available
