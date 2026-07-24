from datetime import date, datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Ordonnance, PriseMedicament
from schemas import PriseMedicamentCreate, PriseMedicamentRead, PriseMedicamentUpdate

router = APIRouter(tags=["prises_medicaments"])

MOMENT_TO_TIME = {"MATIN": "08:00:00", "MIDI": "12:00:00", "SOIR": "20:00:00"}


def generer_prises_pour_ordonnance(db: Session, ordonnance_id: UUID) -> int:
    """Génère automatiquement les prises pour toutes les lignes d'une ordonnance.
    Retourne le nombre de prises créées."""
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        return 0

    start_date = ordonnance.date_debut_traitement or ordonnance.date_emission
    if not start_date:
        return 0

    prises = []
    for ligne in ordonnance.lignes:
        freq = ligne.frequence_par_jour or 1
        if freq >= 3:
            moments = ["MATIN", "MIDI", "SOIR"]
        elif freq == 2:
            moments = ["MATIN", "SOIR"]
        else:
            moments = ["MATIN"]

        for day_offset in range(ligne.duree_jours):
            day = date.fromordinal(start_date.toordinal() + day_offset)
            for m in moments:
                prise = PriseMedicament(
                    ordonnance_id=ordonnance_id,
                    medicament_nom=ligne.medicament_nom,
                    date_prise_prevue=day,
                    heure_prise_prevue=MOMENT_TO_TIME[m],
                    moment_journee=m,
                )
                db.add(prise)
                prises.append(prise)

    if prises:
        db.flush()
    return len(prises)


@router.get("/ordonnances/{ordonnance_id}/prises", response_model=List[PriseMedicamentRead])
async def list_prises(
    ordonnance_id: UUID,
    date_prise: Optional[date] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    stmt = select(PriseMedicament).where(PriseMedicament.ordonnance_id == ordonnance_id)
    if date_prise:
        stmt = stmt.where(PriseMedicament.date_prise_prevue == date_prise)
    if statut:
        stmt = stmt.where(PriseMedicament.statut == statut)
    stmt = stmt.order_by(PriseMedicament.date_prise_prevue, PriseMedicament.heure_prise_prevue)
    return db.execute(stmt).scalars().all()


@router.post("/ordonnances/{ordonnance_id}/prises", response_model=PriseMedicamentRead, status_code=status.HTTP_201_CREATED)
async def create_prise(
    ordonnance_id: UUID,
    payload: PriseMedicamentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if payload.ordonnance_id != ordonnance_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'ID de l'ordonnance ne correspond pas")

    valid_moments = ("MATIN", "MIDI", "SOIR")
    if payload.moment_journee not in valid_moments:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Moment invalide. Valeurs acceptées : {', '.join(valid_moments)}")

    prise = PriseMedicament(
        ordonnance_id=ordonnance_id,
        medicament_nom=payload.medicament_nom,
        date_prise_prevue=payload.date_prise_prevue,
        heure_prise_prevue=payload.heure_prise_prevue,
        moment_journee=payload.moment_journee,
    )
    db.add(prise)
    db.commit()
    db.refresh(prise)
    return prise


@router.put("/prises/{prise_id}", response_model=PriseMedicamentRead)
async def update_prise(
    prise_id: UUID,
    payload: PriseMedicamentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    prise = db.get(PriseMedicament, prise_id)
    if not prise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prise non trouvée")

    ordonnance = db.get(Ordonnance, prise.ordonnance_id)
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    valid_statuts = ("A_PRENDRE", "PRIS", "OUBLIE")
    if payload.statut not in valid_statuts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Statut invalide. Valeurs acceptées : {', '.join(valid_statuts)}")

    prise.statut = payload.statut
    if payload.statut == "PRIS":
        prise.date_prise_effective = payload.date_prise_effective or datetime.now(timezone.utc)
    elif payload.statut == "A_PRENDRE":
        prise.date_prise_effective = None

    db.commit()
    db.refresh(prise)
    return prise


def _validate_prise_access(db: Session, prise: PriseMedicament, current_user) -> Ordonnance:
    ordonnance = db.get(Ordonnance, prise.ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance associée introuvable")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return ordonnance


@router.put("/prises/{prise_id}/confirmer", response_model=PriseMedicamentRead)
async def confirmer_prise(
    prise_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    prise = db.get(PriseMedicament, prise_id)
    if not prise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prise non trouvée")

    ordonnance = _validate_prise_access(db, prise, current_user)

    if ordonnance.statut != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette ordonnance n'est plus active")
    if ordonnance.statut_traitement and ordonnance.statut_traitement != "EN_COURS":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le traitement n'est plus en cours")
    if prise.statut != "A_PRENDRE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Impossible de confirmer une prise avec le statut « {prise.statut} »")

    prise.statut = "PRIS"
    prise.date_prise_effective = datetime.now(timezone.utc)
    db.commit()
    db.refresh(prise)
    return prise


@router.put("/prises/{prise_id}/oublier", response_model=PriseMedicamentRead)
async def oublier_prise(
    prise_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    prise = db.get(PriseMedicament, prise_id)
    if not prise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prise non trouvée")

    ordonnance = _validate_prise_access(db, prise, current_user)

    if ordonnance.statut != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette ordonnance n'est plus active")
    if ordonnance.statut_traitement and ordonnance.statut_traitement != "EN_COURS":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le traitement n'est plus en cours")
    if prise.statut != "A_PRENDRE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Impossible de marquer comme oubliée une prise avec le statut « {prise.statut} »")

    prise.statut = "OUBLIE"
    prise.date_prise_effective = None
    db.commit()
    db.refresh(prise)
    return prise


@router.delete("/prises/{prise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prise(
    prise_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    prise = db.get(PriseMedicament, prise_id)
    if not prise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prise non trouvée")

    ordonnance = db.get(Ordonnance, prise.ordonnance_id)
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(prise)
    db.commit()


@router.post("/ordonnances/{ordonnance_id}/prises/generer", response_model=List[PriseMedicamentRead], status_code=status.HTTP_201_CREATED)
async def generer_prises(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    existing = db.execute(
        select(PriseMedicament).where(PriseMedicament.ordonnance_id == ordonnance_id)
    ).scalars().all()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Des prises existent déjà pour cette ordonnance. Supprimez-les d'abord.")

    count = generer_prises_pour_ordonnance(db, ordonnance_id)
    if count == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune prise générée. Vérifiez les dates et lignes.")

    db.commit()
    prises = db.execute(
        select(PriseMedicament).where(PriseMedicament.ordonnance_id == ordonnance_id)
        .order_by(PriseMedicament.date_prise_prevue, PriseMedicament.heure_prise_prevue)
    ).scalars().all()
    return prises
