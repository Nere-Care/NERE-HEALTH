from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Consultation, Ordonnance, OrdonnanceLigne, Patient, User
from schemas import OrdonnanceCreate, OrdonnanceRead

from datetime import date, timedelta

router = APIRouter(tags=["ordonnances"])





@router.get("/ordonnances/mes-prescriptions")
async def get_mes_prescriptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Retourne la liste plate de toutes les lignes d'ordonnances du patient connecté."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")

    try:
        # Jointure : OrdonnanceLigne -> Ordonnance -> User (médecin)
        stmt = (
            select(OrdonnanceLigne, Ordonnance, User)
            .join(Ordonnance, OrdonnanceLigne.ordonnance_id == Ordonnance.id)
            .join(User, Ordonnance.medecin_id == User.id)
            .where(Ordonnance.patient_id == current_user.id)
            .order_by(Ordonnance.date_emission.desc())
        )
        rows = db.execute(stmt).all()

        today = date.today()
        result = []
        for ligne, ordonnance, medecin in rows:
            # Calcul renouvellements restants
            nb_renouvellements_restants = (
                (ordonnance.nb_renouvellements_max or 0) - (ordonnance.nb_renouvellements or 0)
            )
            # Urgence : expiration dans moins de 30 jours
            urgence = False
            if ordonnance.date_expiration:
                jours_restants = (ordonnance.date_expiration - today).days
                urgence = 0 <= jours_restants <= 30

            # Construction fréquence lisible
            freq = ""
            if ligne.frequence_par_jour:
                freq = f"{ligne.frequence_par_jour} fois par jour"
            if ligne.posologie:
                freq = f"{freq} - {ligne.posologie}" if freq else ligne.posologie

            result.append({
                "id": str(ligne.id),
                "ordonnance_id": str(ordonnance.id),
                "nom": ligne.medicament_nom,
                "dci": ligne.dci or "",
                "dosage": ligne.dosage,
                "forme": ligne.forme or "",
                "frequence": freq,
                "instructions": ligne.instructions_speciales or "",
                "duree_jours": ligne.duree_jours,
                "quantite": ligne.quantite,
                "medecin": f"Dr. {medecin.prenom} {medecin.nom}",
                "medecin_id": str(medecin.id),
                "date_emission": ordonnance.date_emission.isoformat() if ordonnance.date_emission else None,
                "date_expiration": ordonnance.date_expiration.isoformat() if ordonnance.date_expiration else None,
                "renouvellements": nb_renouvellements_restants,
                "statut": ordonnance.statut or "active",
                "urgence": urgence,
            })
        return result
    except Exception as e:
        # En cas d'erreur, renvoyer un tableau vide plutôt qu'une 500
        print(f"Erreur récupération prescriptions: {e}")
        return []


@router.get("/ordonnances/prescriptions/{ligne_id}")
async def get_prescription_detail(
    ligne_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Détail complet d'une ligne d'ordonnance."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")

    stmt = (
        select(OrdonnanceLigne, Ordonnance, User)
        .join(Ordonnance, OrdonnanceLigne.ordonnance_id == Ordonnance.id)
        .join(User, Ordonnance.medecin_id == User.id)
        .where(OrdonnanceLigne.id == ligne_id)
    )
    row = db.execute(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="Prescription non trouvée")

    ligne, ordonnance, medecin = row

    # Vérifier que c'est bien la prescription du patient
    if ordonnance.patient_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Accès refusé")

    today = date.today()
    nb_renouvellements_restants = (
        (ordonnance.nb_renouvellements_max or 0) - (ordonnance.nb_renouvellements or 0)
    )
    urgence = False
    if ordonnance.date_expiration:
        jours_restants = (ordonnance.date_expiration - today).days
        urgence = 0 <= jours_restants <= 30

    freq = ""
    if ligne.frequence_par_jour:
        freq = f"{ligne.frequence_par_jour} fois par jour"
    if ligne.posologie:
        freq = f"{freq} - {ligne.posologie}" if freq else ligne.posologie

    return {
        "id": str(ligne.id),
        "ordonnance_id": str(ordonnance.id),
        "numero_ordonnance": ordonnance.numero,
        "nom": ligne.medicament_nom,
        "dci": ligne.dci or "",
        "classe_therapeutique": ligne.classe_therapeutique or "",
        "dosage": ligne.dosage,
        "forme": ligne.forme or "",
        "frequence": freq,
        "frequence_par_jour": ligne.frequence_par_jour,
        "posologie": ligne.posologie or "",
        "duree_jours": ligne.duree_jours,
        "quantite": ligne.quantite,
        "instructions": ligne.instructions_speciales or "",
        "interactions": ligne.interactions_a_eviter or "",
        "avant_repas": ligne.avant_repas,
        "medecin": f"Dr. {medecin.prenom} {medecin.nom}",
        "medecin_id": str(medecin.id),
        "date_emission": ordonnance.date_emission.isoformat() if ordonnance.date_emission else None,
        "date_expiration": ordonnance.date_expiration.isoformat() if ordonnance.date_expiration else None,
        "renouvellements": nb_renouvellements_restants,
        "statut": ordonnance.statut or "active",
        "urgence": urgence,
    }



@router.get("/ordonnances", response_model=List[OrdonnanceRead])
async def list_ordonnances(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Ordonnance)
    if patient_id:
        stmt = stmt.where(Ordonnance.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Ordonnance.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Ordonnance.statut == statut)
    if current_user.role != "admin":
        stmt = stmt.where(
            (Ordonnance.medecin_id == current_user.id) | (Ordonnance.patient_id == current_user.id)
        )
    stmt = stmt.order_by(Ordonnance.date_emission.desc()).limit(limit)
    ordonnances = db.execute(stmt).scalars().all()
    return ordonnances


@router.post("/ordonnances", response_model=OrdonnanceRead, status_code=status.HTTP_201_CREATED)
async def create_ordonnance(
    ordonnance_create: OrdonnanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(Patient, ordonnance_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if not db.get(Consultation, ordonnance_create.consultation_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation introuvable")
    medecin = db.get(User, ordonnance_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    ordonnance = Ordonnance(
        **{k: v for k, v in ordonnance_create.dict(exclude={"lignes"}).items() if v is not None}
    )
    db.add(ordonnance)
    db.flush()

    for ligne_data in ordonnance_create.lignes or []:
        ligne = OrdonnanceLigne(
            ordonnance_id=ordonnance.id,
            **ligne_data.dict(exclude_unset=True),
        )
        db.add(ligne)

    try:
        db.commit()
        db.refresh(ordonnance)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création d'ordonnance"
        if "uq_ordonnances_numero" in str(exc.orig):
            detail = "Ce numéro d'ordonnance est déjà utilisé"
        elif "uq_ordonnances_code_pharmacie" in str(exc.orig):
            detail = "Ce code pharmacie est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return ordonnance


@router.get("/ordonnances/{ordonnance_id}", response_model=OrdonnanceRead)
async def read_ordonnance(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return ordonnance

