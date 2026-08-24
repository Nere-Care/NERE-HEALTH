from decimal import Decimal
from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Medecin, Paiement, Retrait
from schemas import RetraitCreate, RetraitRead, RetraitValiderRequest

router = APIRouter(tags=["retraits"])

RATES_TO_XAF = {
    "XAF": Decimal("1"),
    "XOF": Decimal("1"),
    "EUR": Decimal("656"),
    "USD": Decimal("576"),
    "GBP": Decimal("768"),
}


def _get_solde_details_xaf(db: Session, medecin_id: UUID):
    paiements = db.execute(
        select(Paiement)
        .where(
            Paiement.medecin_id == str(medecin_id),
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.type_paiement.notin_(["sequestre_avis", "remboursement_sequestre"]),
        )
    ).scalars().all()

    total_gagne_xaf = Decimal(0)
    for p in paiements:
        montant = p.montant_medecin if p.montant_medecin is not None else p.montant_total
        if montant is not None:
            rate = RATES_TO_XAF.get((p.devise or "XAF").upper(), Decimal("1"))
            total_gagne_xaf += Decimal(str(montant)) * rate

    retraits = db.execute(
        select(Retrait)
        .where(
            Retrait.medecin_id == str(medecin_id),
            Retrait.statut.in_(["valide", "effectue", "en_attente"]),
        )
    ).scalars().all()

    deja_retire_xaf = Decimal(0)
    for r in retraits:
        montant = r.montant
        if montant is not None:
            rate = RATES_TO_XAF.get((r.devise or "XAF").upper(), Decimal("1"))
            deja_retire_xaf += Decimal(str(montant)) * rate

    sequestre_paiements = db.execute(
        select(Paiement)
        .where(
            Paiement.medecin_id == str(medecin_id),
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.type_paiement == "sequestre_avis",
        )
    ).scalars().all()

    remboursement_paiements = db.execute(
        select(Paiement)
        .where(
            Paiement.medecin_id == str(medecin_id),
            Paiement.statut.in_(["confirme", "valide_manuellement"]),
            Paiement.type_paiement == "remboursement_sequestre",
        )
    ).scalars().all()

    sequestre_en_cours_xaf = Decimal(0)
    for p in sequestre_paiements:
        rate = RATES_TO_XAF.get((p.devise or "XAF").upper(), Decimal("1"))
        sequestre_en_cours_xaf += Decimal(str(p.montant_total or 0)) * rate
    for p in remboursement_paiements:
        rate = RATES_TO_XAF.get((p.devise or "XAF").upper(), Decimal("1"))
        sequestre_en_cours_xaf -= Decimal(str(p.montant_total or 0)) * rate

    solde_xaf = max(total_gagne_xaf - deja_retire_xaf - sequestre_en_cours_xaf, Decimal(0))
    return total_gagne_xaf, deja_retire_xaf, solde_xaf, sequestre_en_cours_xaf


def _get_solde_disponible(db: Session, medecin_id: UUID) -> Decimal:
    _, _, solde_xaf, _ = _get_solde_details_xaf(db, medecin_id)
    return solde_xaf


@router.post("/retraits", response_model=RetraitRead, status_code=status.HTTP_201_CREATED)
async def creer_retrait(
    body: RetraitCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    if body.montant <= Decimal("0"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le montant doit être supérieur à 0")

    devise_req = (body.devise or "XAF").upper()
    rate = RATES_TO_XAF.get(devise_req, Decimal("1"))
    montant_xaf = body.montant * rate

    if montant_xaf < Decimal("1000"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le montant minimum est l'équivalent de 1 000 XAF",
        )

    total_gagne_xaf, deja_retire_xaf, solde_xaf, _ = _get_solde_details_xaf(db, current_user.id)
    if montant_xaf > solde_xaf:
        solde_devise = round(solde_xaf / rate, 2)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solde insuffisant. Disponible: {solde_devise} {devise_req}",
        )

    import uuid
    from datetime import datetime

    ref = body.reference
    if not ref:
        date_part = datetime.utcnow().strftime("%Y%m%d")
        rand_part = uuid.uuid4().hex[:6].upper()
        ref = f"TRF-RET-{date_part}-{rand_part}"

    retrait = Retrait(
        medecin_id=current_user.id,
        montant=body.montant,
        devise=body.devise or "XAF",
        methode=body.methode,
        reference=ref,
        compte=body.compte,
        statut="en_attente",
    )
    db.add(retrait)
    db.commit()
    db.refresh(retrait)
    return retrait


@router.get("/retraits", response_model=List[RetraitRead])
async def lister_retraits(
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Retrait)
    if current_user.role != "admin":
        stmt = stmt.where(Retrait.medecin_id == str(current_user.id))
    stmt = stmt.order_by(Retrait.created_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


@router.get("/retraits/solde")
async def obtenir_solde(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    total_gagne_xaf, deja_retire_xaf, solde_xaf, sequestre_en_cours_xaf = _get_solde_details_xaf(db, current_user.id)
    medecin = db.get(Medecin, current_user.id)
    devise = (getattr(medecin, "devise", "XAF") or "XAF").upper()
    rate = RATES_TO_XAF.get(devise, Decimal("1"))

    total_gagne_devise = total_gagne_xaf / rate
    deja_retire_devise = deja_retire_xaf / rate
    sequestre_en_cours_devise = sequestre_en_cours_xaf / rate
    a_retirer_devise = solde_xaf / rate

    return {
        "total_gagne": float(total_gagne_xaf),
        "deja_retire": float(deja_retire_xaf),
        "a_retirer": float(solde_xaf),
        "sequestre_en_cours": float(sequestre_en_cours_xaf),
        "total_gagne_devise": float(round(total_gagne_devise, 2)),
        "deja_retire_devise": float(round(deja_retire_devise, 2)),
        "a_retirer_devise": float(round(a_retirer_devise, 2)),
        "devise": devise,
    }


@router.get("/admin/retraits", response_model=List[RetraitRead])
async def admin_lister_retraits(
    statut: str = None,
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    stmt = select(Retrait)
    if statut:
        stmt = stmt.where(Retrait.statut == statut)
    stmt = stmt.order_by(Retrait.created_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


@router.put("/admin/retraits/{retrait_id}/valider", response_model=RetraitRead)
async def admin_valider_retrait(
    retrait_id: UUID,
    body: RetraitValiderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    retrait = db.get(Retrait, retrait_id)
    if not retrait:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Retrait non trouvé")
    if retrait.statut != "en_attente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ce retrait ne peut plus être traité (statut: {retrait.statut})",
        )

    if body.statut not in ("valide", "rejete", "effectue"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")

    retrait.statut = body.statut
    retrait.admin_id = current_user.id
    if body.motif_rejet:
        retrait.motif_rejet = body.motif_rejet
    if body.reference:
        retrait.reference = body.reference

    db.commit()
    db.refresh(retrait)
    return retrait


@router.get("/portefeuille/solde")
async def obtenir_solde_portefeuille(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    solde = _get_solde_disponible(db, current_user.id)
    return {"solde": float(solde), "devise": "XAF"}


@router.post("/portefeuille/recharger", status_code=status.HTTP_200_OK)
async def recharger_portefeuille(
    body: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    from services.wallet_service import crediter_portefeuille
    import uuid as _uuid

    montant = body.get("montant")
    if not montant or float(montant) <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Montant invalide")

    montant = Decimal(str(montant))
    methode = body.get("methode", "mtn_momo")
    telephone = body.get("telephone")

    from services.payment_provider import get_payment_provider
    provider = get_payment_provider()
    ref = f"RCH-{_uuid.uuid4().hex[:12].upper()}"

    result = provider.initiate(
        montant=float(montant),
        devise="XAF",
        reference=ref,
        methode=methode,
        telephone=telephone,
    )

    if not result.success:
        raise HTTPException(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=result.message)

    crediter_portefeuille(db, current_user.id, montant)
    db.commit()

    return {
        "reference": ref,
        "montant": float(montant),
        "message": "Recharge initiée avec succès",
    }
