from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db

import uuid as uuid_module
from models import Paiement, User, RendezVous, Medecin
from schemas import PaiementCreate, PaiementRead, PreautorisationRequest

router = APIRouter(tags=["paiements"])


@router.get("/paiements", response_model=List[PaiementRead])
async def list_paiements(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
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


@router.get("/mes-factures")
async def mes_factures(
    statut: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = (
        select(Paiement, User)
        .join(User, Paiement.medecin_id == User.id)
        .where(Paiement.patient_id == current_user.id)
        .order_by(Paiement.created_at.desc())
    )

    if statut:
        statut_map = {
            "Payé": "confirme",
            "En attente": "en_attente",
            "Annulé": "annule",
        }
        db_statut = statut_map.get(statut)
        if db_statut:
            stmt = stmt.where(Paiement.statut == db_statut)

    rows = db.execute(stmt).all()

    return [
        {
            "id": str(p.id),
            "reference": p.reference,
            "date": p.created_at.strftime("%d/%m/%Y"),
            "medecin": f"Dr. {u.prenom} {u.nom}",
            "acte": f"Consultation — {p.methode.replace('_', ' ').title()}",
            "montant": float(p.montant_total),
            "devise": p.devise or "XAF",
            "statut": {
                "confirme": "Payé",
                "en_attente": "En attente",
                "initie": "En attente",
                "echoue": "Annulé",
                "annule": "Annulé",
                "rembourse": "Annulé",
            }.get(p.statut, p.statut),
            "methode": p.methode,
            "fournisseur": p.fournisseur,
        }
        for p, u in rows
    ]



# Méthodes acceptées par l'ENUM methode_paiement
METHODES_MOBILE = ["mtn_momo", "orange_money"]
METHODES_CARTE = ["carte_visa", "carte_mastercard", "stripe", "notchpay"]
METHODES_AUTRES = ["virement_bancaire", "portefeuille_nere"]

@router.post("/paiements/preautorisation")
async def preautoriser_paiement(
    data: PreautorisationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Réservé aux patients")
    
    # Validation du fournisseur (doit correspondre à l'ENUM methode_paiement)
    if data.fournisseur not in METHODES_MOBILE + METHODES_CARTE + METHODES_AUTRES:
        raise HTTPException(status_code=400, detail=f"Méthode de paiement invalide: {data.fournisseur}")
    
    # Validation selon le type
    if data.fournisseur in METHODES_MOBILE:
        if not data.phone_number:
            raise HTTPException(status_code=400, detail="Numéro de téléphone requis pour Mobile Money")
        clean_phone = data.phone_number.replace(" ", "").replace("+", "")
        if len(clean_phone) < 9:
            raise HTTPException(status_code=400, detail="Numéro de téléphone invalide")
    
    elif data.fournisseur in METHODES_CARTE:
        if not data.card_number or not data.card_holder:
            raise HTTPException(status_code=400, detail="Numéro de carte et titulaire requis")
        clean_card = data.card_number.replace(" ", "")
        if len(clean_card) < 12:
            raise HTTPException(status_code=400, detail="Numéro de carte invalide")
    
    # Récupérer le RDV
    rdv = db.query(RendezVous).filter(RendezVous.id == data.rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="RDV introuvable")
    if rdv.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ce RDV ne vous appartient pas")
    
    montant = float(rdv.montant) if rdv.montant else 5000
    reference = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid_module.uuid4())[:8].upper()}"
    
    # Simulation délai
    import asyncio
    await asyncio.sleep(1.5)
    
    paiement = Paiement(
        reference=reference,
        rdv_id=rdv.id,
        patient_id=current_user.id,
        medecin_id=rdv.medecin_id,
        montant_total=montant,
        devise="XAF",
        methode=data.fournisseur,  # ✅ c'est le fournisseur qui correspond à l'ENUM
        fournisseur=data.fournisseur,
        statut="initie",
        ip_paiement="127.0.0.1",
        user_agent_paiement="Web/1.0",
    )
    db.add(paiement)
    
    try:
        db.commit()
        db.refresh(paiement)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erreur création paiement: {exc}") from exc
    
    return {
        "id": str(paiement.id),
        "reference": paiement.reference,
        "montant": float(paiement.montant_total),
        "statut": "preautorise",
        "message": "Paiement pré-autorisé avec succès. L'argent sera débité quand le médecin validera le RDV.",
    }