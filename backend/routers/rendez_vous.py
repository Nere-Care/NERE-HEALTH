from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Patient, RendezVous, User
from schemas import RendezVousCreate, RendezVousRead
from datetime import datetime, timedelta
import uuid as uuid_module


router = APIRouter(tags=["rendez_vous"])


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







@router.post("/rendez_vous/patient", response_model=RendezVousRead, status_code=status.HTTP_201_CREATED)
async def creer_rdv_patient(
    rdv_data: dict,  # {medecin_id, date_heure_debut, date_heure_fin, type, motif_consultation}
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Un patient crée un RDV pour lui-même."""
    if current_user.role != "patient":
        raise HTTPException(403, "Réservé aux patients")
    
    medecin_id = rdv_data.get("medecin_id")
    if not medecin_id:
        raise HTTPException(400, "medecin_id requis")
    
    medecin = db.get(User, medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(400, "Médecin introuvable")
    
    # Récupérer le tarif du médecin
    from models import Medecin
    medecin_profil = db.get(Medecin, medecin_id)
    tarif = float(medecin_profil.tarif_consultation) if medecin_profil else 5000
    
    numero_rdv = f"RDV-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid_module.uuid4())[:6].upper()}"
    
    rdv = RendezVous(
        numero_rdv=numero_rdv,
        patient_id=current_user.id,
        medecin_id=medecin_id,
        date_heure_debut=datetime.fromisoformat(rdv_data["date_heure_debut"]),
        date_heure_fin=datetime.fromisoformat(rdv_data["date_heure_fin"]),
        type=rdv_data.get("type", "presentiel"),
        motif_consultation=rdv_data.get("motif_consultation", ""),
        statut="en_attente",
        montant=tarif,
    )
    db.add(rdv)
    try:
        db.commit()
        db.refresh(rdv)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(400, f"Erreur création RDV: {exc.orig}") from exc
    
    return rdv


@router.get("/mes-rendez-vous")
async def mes_rendez_vous(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Liste des RDV du patient connecté."""
    if current_user.role != "patient":
        raise HTTPException(403, "Réservé aux patients")
    
    rdvs = db.query(RendezVous).filter(
        RendezVous.patient_id == current_user.id
    ).order_by(RendezVous.date_heure_debut.desc()).all()
    
    result = []
    for r in rdvs:
        medecin = db.get(User, r.medecin_id)
        result.append({
            "id": str(r.id),
            "numero_rdv": r.numero_rdv,
            "medecin": f"Dr. {medecin.prenom} {medecin.nom}" if medecin else "Inconnu",
            "medecin_id": str(r.medecin_id),
            "date": r.date_heure_debut.isoformat(),
            "type": r.type,
            "motif": r.motif_consultation,
            "statut": r.statut,
            "montant": float(r.montant) if r.montant else 0,
        })
    return result


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
    from models import Paiement
    paiement = db.query(Paiement).filter(
        Paiement.rdv_id == rdv_id,
        Paiement.statut == "initie"
    ).first()
    
    if paiement:
        paiement.statut = "confirme"
        paiement.date_remboursement = datetime.utcnow()  # réutilise comme date_debit
    
    db.commit()
    return {"message": "RDV validé et paiement confirmé", "rdv_id": str(rdv_id)}