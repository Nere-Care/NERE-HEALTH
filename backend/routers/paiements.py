from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Paiement, RendezVous, User
from schemas import PaiementCreate, PaiementInitierRequest, PaiementRead, PaiementValiderRequest
from services.payment_provider import get_payment_provider

router = APIRouter(tags=["paiements"])


def _generate_reference():
    return f"PAY-{uuid4().hex[:12].upper()}"


@router.get("/paiements", response_model=List[PaiementRead])
async def list_paiements(
    patient_id: Optional[str] = None,
    medecin_id: Optional[str] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Paiement)
    if patient_id:
        stmt = stmt.where(Paiement.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Paiement.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Paiement.statut == statut)
    if current_user.role != "admin":
        stmt = stmt.where(
            (Paiement.medecin_id == current_user.id) | (Paiement.patient_id == current_user.id)
        )
        if current_user.role == "patient":
            stmt = stmt.where(Paiement.type_paiement.notin_(["sequestre_avis", "remboursement_sequestre", "honoraires_avis"]))
    stmt = stmt.order_by(Paiement.created_at.desc()).limit(limit)
    paiements = db.execute(stmt).scalars().all()
    return paiements


@router.post("/paiements", response_model=PaiementRead, status_code=status.HTTP_201_CREATED)
async def create_paiement(
    paiement_create: PaiementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(User, paiement_create.patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    medecin = db.get(User, paiement_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    paiement = Paiement(**paiement_create.dict(exclude_unset=True))
    db.add(paiement)
    try:
        db.commit()
        db.refresh(paiement)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création du paiement"
        if "uq_paiements_reference" in str(exc.orig):
            detail = "Cette référence de paiement est déjà utilisée"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return paiement


@router.post("/paiements/initier", response_model=PaiementRead, status_code=status.HTTP_201_CREATED)
async def initier_paiement(
    rdv_id: str,
    body: PaiementInitierRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("patient")),
):
    try:
        rdv_uuid = UUID(rdv_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID RDV invalide")

    rdv = db.get(RendezVous, rdv_uuid)
    if not rdv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")
    if str(rdv.patient_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce RDV ne vous appartient pas")
    if rdv.statut not in ("en_attente_paiement", "en_attente"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ce RDV ne peut plus être payé (statut actuel: {rdv.statut})",
        )

    existing = db.execute(
        select(Paiement).where(
            Paiement.rdv_id == rdv_uuid,
            Paiement.statut.notin_(["annule", "echoue", "expire"]),
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Un paiement existe déjà pour ce RDV")

    provider = get_payment_provider()
    reference = _generate_reference()
    montant = float(rdv.montant) if rdv.montant else 0.0

    result = provider.initiate(
        montant=montant,
        devise=rdv.devise or "XAF",
        reference=reference,
        methode=body.methode,
        telephone=body.telephone,
        email=body.email,
    )

    if not result.success:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=result.message)

    montant_decimal = round(montant * 0.10, 2)
    paiement = Paiement(
        reference=reference,
        rdv_id=rdv_uuid,
        patient_id=current_user.id,
        medecin_id=rdv.medecin_id,
        montant_total=montant,
        devise=rdv.devise or "XAF",
        frais_plateforme=montant_decimal,
        montant_medecin=round(montant - montant_decimal, 2),
        methode=body.methode,
        fournisseur="interne",
        statut="en_attente_validation",
        reference_fournisseur=result.reference_fournisseur,
        transaction_id_externe=result.transaction_id,
        telephone_paiement=body.telephone if body.methode in ("mtn_momo", "orange_money") else None,
        derniers_4_chiffres=body.derniers_4_chiffres if body.methode in ("carte_visa", "carte_mastercard") else None,
    )
    db.add(paiement)

    rdv.statut = "paye_en_attente_validation"
    db.commit()
    db.refresh(paiement)

    return paiement


@router.put("/paiements/{paiement_id}/valider", response_model=PaiementRead)
async def valider_paiement(
    paiement_id: str,
    body: PaiementValiderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    try:
        pid = UUID(paiement_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ID invalide")

    paiement = db.get(Paiement, pid)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    if paiement.statut != "en_attente_validation":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ce paiement ne peut plus être validé (statut: {paiement.statut})",
        )

    if body.statut == "valide_manuellement":
        paiement.statut = "valide_manuellement"
        rdv = db.get(RendezVous, paiement.rdv_id)
        if rdv and rdv.statut != "confirme":
            rdv.statut = "confirme"
            from routers.rendez_vous import _send_rdv_code_message
            _send_rdv_code_message(db, rdv)
    elif body.statut == "echoue":
        paiement.statut = "echoue"
        rdv = db.get(RendezVous, paiement.rdv_id)
        if rdv:
            rdv.statut = "en_attente_paiement"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")

    db.commit()
    db.refresh(paiement)
    return paiement


@router.get("/paiements/{paiement_id}", response_model=PaiementRead)
async def read_paiement(
    paiement_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    paiement = db.get(Paiement, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    if current_user.role != "admin" and current_user.id not in (paiement.medecin_id, paiement.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return paiement
