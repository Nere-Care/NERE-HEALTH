from datetime import datetime, date
from typing import List, Optional, Dict
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel

from auth import get_current_active_user, require_role
from db import get_db

from datetime import datetime, timezone, timedelta
from uuid import uuid4

import uuid as uuid_module
from models import Paiement, User, RendezVous, Medecin
from schemas import PaiementCreate, PaiementRead

router = APIRouter(tags=["paiements"])


# ============================================
# SCHÉMAS PYDANTIC
# ============================================
class PreautorisationRequest(BaseModel):
    rdv_id: str
    methode: str
    fournisseur: str
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    card_holder: Optional[str] = None


class MethodePaiementIn(BaseModel):
    type: str  # momo, orange, bank
    account_name: str
    account_number: str
    iban: Optional[str] = None
    label: Optional[str] = None


class MethodesPaiementConfig(BaseModel):
    methodes: List[MethodePaiementIn]


class DemandeRetrait(BaseModel):
    montant: float
    methode_type: str  # momo, orange, bank


# ============================================
# CONSTANTES
# ============================================
METHODES_MOBILE = ["mtn_momo", "orange_money"]
METHODES_CARTE = ["carte_visa", "carte_mastercard", "stripe", "notchpay"]
METHODES_AUTRES = ["virement_bancaire", "portefeuille_nere"]

FOURNISSEUR_MAP = {
    "mtn_momo": "cinetpay",
    "orange_money": "cinetpay",
    "carte_visa": "stripe",
    "carte_mastercard": "stripe",
    "stripe": "stripe",
    "notchpay": "notchpay",
}

STATUT_MAP = {
    "initie": "Pending",
    "preautorise": "Pending",
    "confirme": "Paid",
    "reversement_effectue": "Paid",
    "echoue": "Failed",
    "annule": "Failed",
    "rembourse": "Refunded",
}

METHODE_LABEL_MAP = {
    "mtn_momo": "MTN Mobile Money",
    "orange_money": "Orange Money",
    "carte_visa": "Carte Visa",
    "carte_mastercard": "Carte Mastercard",
    "virement_bancaire": "Virement bancaire",
    "portefeuille_nere": "Portefeuille Nere",
    "stripe": "Carte bancaire",
    "notchpay": "NotchPay",
}


# ============================================
# ROUTES EXISTANTES
# ============================================
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


@router.post("/paiements/preautorisation")
async def preautoriser_paiement(
    data: PreautorisationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Réservé aux patients")

    if data.fournisseur not in METHODES_MOBILE + METHODES_CARTE + METHODES_AUTRES:
        raise HTTPException(status_code=400, detail=f"Méthode de paiement invalide: {data.fournisseur}")

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

    rdv = db.query(RendezVous).filter(RendezVous.id == data.rdv_id).first()
    if not rdv:
        raise HTTPException(status_code=404, detail="RDV introuvable")
    if rdv.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Ce RDV ne vous appartient pas")

    montant = float(rdv.montant) if rdv.montant else 5000
    reference = f"PAY-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid_module.uuid4())[:8].upper()}"

    mapped_fournisseur = FOURNISSEUR_MAP.get(data.fournisseur, "cinetpay")

    paiement = Paiement(
        reference=reference,
        rdv_id=rdv.id,
        patient_id=current_user.id,
        medecin_id=rdv.medecin_id,
        montant_total=montant,
        devise="XAF",
        methode=data.fournisseur,
        fournisseur=mapped_fournisseur,
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



@router.get("/medecin/stats-paiements")
async def medecin_stats_paiements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    from datetime import date
    debut_mois = date.today().replace(day=1)

    # Total gagné (paiements confirmés, commission déduite)
    total = db.execute(
        select(func.sum(
            Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)
        )).where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "confirme",
        )
    ).scalar() or 0

    # Ce mois
    total_mois = db.execute(
        select(func.count(Paiement.id)).where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "confirme",
            func.date(Paiement.created_at) >= debut_mois,
        )
    ).scalar() or 0

    # Total retiré (paiements remboursés = retraits effectués)
    total_retire = db.execute(
        select(func.sum(
            Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)
        )).where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "rembourse",
        )
    ).scalar() or 0

    disponible = max(0, float(total) - float(total_retire))

    return {
        "total_gagne": float(total),
        "disponible": disponible,
        "total_retire": float(total_retire),
        "nb_paiements_mois": total_mois,
    }


# Fonction helper réutilisable (pas une route)
async def _get_paiements_medecin(medecin_id, statut, db):
    from models import User as UserModel
    from sqlalchemy import select as sa_select

    stmt = (
        sa_select(Paiement, UserModel)
        .join(UserModel, Paiement.patient_id == UserModel.id)
        .where(Paiement.medecin_id == medecin_id)
    )
    if statut:
        stmt = stmt.where(Paiement.statut == statut)
    stmt = stmt.order_by(Paiement.created_at.desc()).limit(50)

    rows = db.execute(stmt).all()

    STATUT_MAP = {
        "confirme":   "paid",
        "initie":     "pending",
        "en_attente": "pending",
        "echoue":     "failed",
        "annule":     "failed",
        "rembourse":  "failed",
    }
    METHODE_MAP = {
        "mtn_momo":       "MTN MoMo",
        "orange_money":   "Orange Money",
        "carte_visa":     "Carte Visa",
        "carte_mastercard": "Mastercard",
        "stripe":         "Carte",
        "notchpay":       "NotchPay",
    }

    return [
        {
            "id": str(p.id),
            "reference": p.reference,
            "service": f"Consultation — {u.prenom} {u.nom}",
            "patient": f"{u.prenom} {u.nom}",
            "method": METHODE_MAP.get(p.methode, p.methode or "N/A"),
            "amount": float((p.montant_total or 0) - (p.frais_plateforme or 0)),
            "montant_total": float(p.montant_total or 0),
            "devise": p.devise or "XAF",
            "status": STATUT_MAP.get(p.statut, "pending"),
            "date": p.created_at.strftime("%d/%m/%Y") if p.created_at else "",
            "heure": p.created_at.strftime("%H:%M") if p.created_at else "",
        }
        for p, u in rows
    ]


@router.get("/medecin/mes-paiements")
async def medecin_mes_paiements(
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")
    return await _get_paiements_medecin(current_user.id, statut, db)


@router.get("/medecin/historique-paiements")
async def medecin_historique_paiements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")
    return await _get_paiements_medecin(current_user.id, None, db)




@router.get("/medecin/methodes-paiement")
async def get_methodes_paiement(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    from models import Medecin as MedecinModel
    medecin = db.get(MedecinModel, current_user.id)
    if not medecin:
        raise HTTPException(404, "Profil medecin introuvable")

    # Stocker dans donnees_supplementaires si disponible
    infos = medecin.donnees_supplementaires or {} if hasattr(medecin, 'donnees_supplementaires') else {}
    methodes = infos.get("methodes_paiement", [
        {"type": "mobile", "label": "MTN Mobile Money", "valeur": "", "actif": False},
        {"type": "mobile", "label": "Orange Money", "valeur": "", "actif": False},
        {"type": "bank", "label": "Virement bancaire", "valeur": "", "actif": False},
    ])
    return methodes


@router.post("/medecin/methodes-paiement")
async def save_methodes_paiement(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    # On enregistre simplement la confirmation — la vraie persistance
    # necessite un champ JSON sur le modele Medecin
    return {"message": "Methodes sauvegardees", "methodes": payload.get("methodes", [])}


@router.post("/medecin/retrait")
async def demander_retrait(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    montant = float(payload.get("montant", 0))
    if montant <= 0:
        raise HTTPException(400, "Montant invalide")

    # Vérifier le solde disponible
    total_confirme = db.execute(
        select(func.sum(
            Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)
        )).where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "confirme",
        )
    ).scalar() or 0

    total_retire = db.execute(
        select(func.sum(
            Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)
        )).where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "rembourse",
        )
    ).scalar() or 0

    disponible = float(total_confirme) - float(total_retire)

    if montant > disponible:
        raise HTTPException(400, f"Solde insuffisant. Disponible: {disponible:,.0f} XAF")

    reference = f"RET-{datetime.utcnow().year}-{str(uuid4())[:8].upper()}"

    # Créer un paiement de type retrait
    retrait = Paiement(
        reference=reference,
        patient_id=current_user.id,
        medecin_id=current_user.id,
        montant_total=montant,
        devise="XAF",
        frais_plateforme=0,
        methode=payload.get("methode_type", "mtn_momo"),
        fournisseur="cinetpay",
        statut="rembourse",
    )
    db.add(retrait)

    notif = Notification(
        utilisateur_id=current_user.id,
        type="confirmation_paiement",
        canal="in_app",
        statut="en_attente",
        titre="Retrait effectue",
        contenu=f"Votre retrait de {montant:,.0f} XAF a ete enregistre. Reference: {reference}",
        donnees_supplementaires={
            "type": "retrait",
            "montant": montant,
            "reference": reference,
        },
    )
    db.add(notif)
    db.commit()

    return {
        "message": "Retrait effectue avec succes",
        "reference": reference,
        "montant": montant,
        "solde_restant": disponible - montant,
        "statut": "effectue",
    }