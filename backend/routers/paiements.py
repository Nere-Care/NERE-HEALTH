from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4

import stripe
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..config import settings
from ..limiter import payment_limiter
from ..db import get_db
from ..models import Paiement, Patient, Medecin, RendezVous, User
from ..schemas import (
    PaiementCheckoutRequest,
    PaiementCheckoutResponse,
    PaiementCreate,
    PaiementRead,
)

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
@payment_limiter.limit("10/minute")  # Création paiements: 10/minute
async def create_paiement(
    request: Request,
    paiement_create: PaiementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(User, paiement_create.patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    patient_profile = db.get(Patient, patient.id)
    if not patient_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil patient introuvable")

    medecin = db.get(User, paiement_create.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    medecin_profile = db.get(Medecin, medecin.id)
    if not medecin_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil médecin introuvable")

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


@router.post(
    "/paiements/checkout",
    response_model=PaiementCheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
@payment_limiter.limit("3/minute")  # Paiements très stricts: 3/minute
async def create_checkout_session(
    request: Request,
    checkout_request: PaiementCheckoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not settings.STRIPE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe n'est pas configuré pour ce service.",
        )

    patient = db.get(User, checkout_request.patient_id)
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    patient_profile = db.get(Patient, patient.id)
    if not patient_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil patient introuvable")

    medecin = db.get(User, checkout_request.medecin_id)
    if not medecin or medecin.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    medecin_profile = db.get(Medecin, medecin.id)
    if not medecin_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil médecin introuvable")

    rdv = db.get(RendezVous, checkout_request.rdv_id)
    if not rdv:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

    reference = f"stripe-{uuid4().hex[:16]}"
    paiement = Paiement(
        reference=reference,
        rdv_id=checkout_request.rdv_id,
        patient_id=checkout_request.patient_id,
        medecin_id=checkout_request.medecin_id,
        montant_total=checkout_request.montant_total,
        devise=checkout_request.devise,
        methode=checkout_request.methode,
        fournisseur=checkout_request.fournisseur,
        statut="en_attente_confirmation",
    )
    db.add(paiement)
    db.commit()
    db.refresh(paiement)

    stripe.api_key = settings.STRIPE_API_KEY
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": checkout_request.devise.lower(),
                        "product_data": {
                            "name": checkout_request.description,
                        },
                        "unit_amount": int(checkout_request.montant_total * 100),
                    },
                    "quantity": 1,
                }
            ],
            success_url=settings.STRIPE_SUCCESS_URL,
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={
                "paiement_id": str(paiement.id),
                "patient_id": str(checkout_request.patient_id),
            },
        )
    except Exception as exc:
        db.delete(paiement)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Impossible de créer la session de paiement Stripe: {exc}",
        ) from exc

    paiement.reference_fournisseur = session.id
    paiement.url_paiement = session.url
    db.add(paiement)
    db.commit()
    db.refresh(paiement)

    return PaiementCheckoutResponse(
        paiement_id=paiement.id,
        checkout_url=session.url,
        reference=paiement.reference,
        statut=paiement.statut,
        fournisseur_session_id=session.id,
    )


@router.post("/paiements/webhook")
@payment_limiter.limit("100/minute")  # Webhooks: permissif mais avec validation stricte
async def handle_stripe_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret n'est pas configuré.",
        )

    payload = await request.body()
    signature = request.headers.get("stripe-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="En-tête de signature Stripe manquant")

    stripe.api_key = settings.STRIPE_API_KEY
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signature Stripe invalide: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Échec de traitement du webhook Stripe: {exc}",
        ) from exc

    event_type = event.get("type")
    payload_data = event.get("data", {}).get("object", {})
    session_id = payload_data.get("id")
    paiement = db.query(Paiement).filter(Paiement.reference_fournisseur == session_id).first()
    if paiement:
        paiement.webhook_data = payload_data
        paiement.webhook_signature = signature
        if event_type == "checkout.session.completed":
            paiement.statut = "confirme"
            paiement.transaction_id_externe = payload_data.get("payment_intent")
        elif event_type == "checkout.session.expired":
            paiement.statut = "expire"
        db.add(paiement)
        db.commit()

    return JSONResponse({"received": True})


@router.get("/paiements/{paiement_id}", response_model=PaiementRead)
@payment_limiter.limit("30/minute")  # Lecture paiements: 30/minute
async def read_paiement(
    request: Request,
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
