import os
import secrets
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import CategorieTicket, Ticket, TicketReponse, User, Patient
from schemas import (
    CategorieTicketRead,
    TicketCreate,
    TicketRead,
    TicketReponseCreate,
    TicketReponseRead,
    TicketUpdate,
)
from services.notification_service import notification_service

router = APIRouter(tags=["tickets"])


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

@router.get("/categories-tickets", response_model=List[CategorieTicketRead])
async def list_categories(db: Session = Depends(get_db)):
    cats = db.execute(
        select(CategorieTicket).where(CategorieTicket.actif == True).order_by(CategorieTicket.nom)
    ).scalars().all()
    return cats


# ---------------------------------------------------------------------------
# Tickets — CRUD
# ---------------------------------------------------------------------------

@router.post("/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    cat = db.get(CategorieTicket, ticket_in.categorie_id)
    if not cat or not cat.actif:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Catégorie introuvable ou inactive")

    ticket = Ticket(
        patient_id=current_user.id,
        numero=f"TCK-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(3).upper()}",
        categorie_id=ticket_in.categorie_id,
        sujet=ticket_in.sujet,
        description=ticket_in.description,
        piece_jointe_url=ticket_in.piece_jointe_url,
    )
    db.add(ticket)
    try:
        db.commit()
        db.refresh(ticket)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du ticket") from exc

    return _enrich_ticket(ticket, db)


@router.get("/tickets", response_model=List[TicketRead])
async def list_tickets(
    statut: Optional[str] = None,
    categorie_id: Optional[UUID] = None,
    priorite: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Ticket)

    if current_user.role == "patient":
        stmt = stmt.where(Ticket.patient_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if statut:
        stmt = stmt.where(Ticket.statut == statut)
    if categorie_id:
        stmt = stmt.where(Ticket.categorie_id == categorie_id)
    if priorite:
        stmt = stmt.where(Ticket.priorite == priorite)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Ticket.sujet.ilike(like) | Ticket.description.ilike(like))

    tickets = db.execute(
        stmt.order_by(Ticket.created_at.desc()).offset(offset).limit(limit)
    ).scalars().all()

    return [_enrich_ticket(t, db) for t in tickets]


@router.get("/tickets/{ticket_id}", response_model=TicketRead)
async def read_ticket(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
    if current_user.role == "patient" and ticket.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return _enrich_ticket(ticket, db)


@router.put("/tickets/{ticket_id}", response_model=TicketRead)
async def update_ticket(
    ticket_id: UUID,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")

    update_data = ticket_in.dict(exclude_unset=True)

    if "assigne_a" in update_data and update_data["assigne_a"] is not None:
        assigne = db.get(User, update_data["assigne_a"])
        if not assigne:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur introuvable")

    for field, value in update_data.items():
        setattr(ticket, field, value)

    db.add(ticket)
    try:
        db.commit()
        db.refresh(ticket)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de mise à jour") from exc

    return _enrich_ticket(ticket, db)


# ---------------------------------------------------------------------------
# Upload pièce jointe
# ---------------------------------------------------------------------------

UPLOAD_DIR = "uploads/tickets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".txt", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/tickets/upload", status_code=status.HTTP_201_CREATED)
async def upload_ticket_file(
    file: UploadFile,
    current_user=Depends(get_current_active_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Type de fichier non autorisé: {ext}")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 Mo)")

    import secrets
    filename = f"{secrets.token_hex(16)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    return {"url": f"/uploads/tickets/{filename}", "filename": file.filename}


# ---------------------------------------------------------------------------
# Réponses
# ---------------------------------------------------------------------------

@router.get("/tickets/{ticket_id}/reponses", response_model=List[TicketReponseRead])
async def list_reponses(
    ticket_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
    if current_user.role == "patient" and ticket.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    reponses = db.execute(
        select(TicketReponse)
        .where(TicketReponse.ticket_id == ticket_id)
        .order_by(TicketReponse.created_at.asc())
    ).scalars().all()

    return [_enrich_reponse(r, db) for r in reponses]


@router.post("/tickets/{ticket_id}/reponses", response_model=TicketReponseRead, status_code=status.HTTP_201_CREATED)
async def create_reponse(
    ticket_id: UUID,
    reponse_in: TicketReponseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")
    if current_user.role == "patient" and ticket.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    reponse = TicketReponse(
        ticket_id=ticket_id,
        auteur_id=current_user.id,
        contenu=reponse_in.contenu,
        piece_jointe_url=reponse_in.piece_jointe_url,
    )
    db.add(reponse)

    if current_user.role == "admin" and ticket.statut == "ouvert":
        ticket.statut = "en_cours"

    db.add(ticket)
    try:
        db.commit()
        db.refresh(reponse)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la réponse") from exc

    if current_user.role == "admin":
        _send_ticket_notification(db, ticket, current_user, reponse_in.contenu)

    return _enrich_reponse(reponse, db)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _enrich_ticket(ticket: Ticket, db: Session) -> dict:
    cat = db.get(CategorieTicket, ticket.categorie_id)
    patient_user = db.get(User, ticket.patient_id)
    patient = db.query(Patient).filter(Patient.id == ticket.patient_id).first() if patient_user else None
    assigne_user = db.get(User, ticket.assigne_a) if ticket.assigne_a else None
    nb_reponses = db.execute(
        select(func.count()).where(TicketReponse.ticket_id == ticket.id)
    ).scalar() or 0

    return {
        "id": ticket.id,
        "numero": ticket.numero,
        "patient_id": ticket.patient_id,
        "categorie_id": ticket.categorie_id,
        "sujet": ticket.sujet,
        "description": ticket.description,
        "statut": ticket.statut,
        "priorite": ticket.priorite,
        "assigne_a": ticket.assigne_a,
        "piece_jointe_url": ticket.piece_jointe_url,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "categorie_nom": cat.nom if cat else None,
        "patient_prenom": patient_user.prenom if patient_user else None,
        "patient_nom": patient_user.nom if patient_user else None,
        "numero_patient": patient.code_patient if patient else None,
        "assigne_prenom": assigne_user.prenom if assigne_user else None,
        "assigne_nom": assigne_user.nom if assigne_user else None,
        "nb_reponses": nb_reponses,
    }


def _enrich_reponse(reponse: TicketReponse, db: Session) -> dict:
    auteur = db.get(User, reponse.auteur_id)
    return {
        "id": reponse.id,
        "ticket_id": reponse.ticket_id,
        "auteur_id": reponse.auteur_id,
        "contenu": reponse.contenu,
        "piece_jointe_url": reponse.piece_jointe_url,
        "created_at": reponse.created_at,
        "auteur_prenom": auteur.prenom if auteur else None,
        "auteur_nom": auteur.nom if auteur else None,
        "auteur_role": auteur.role if auteur else None,
    }


def _send_ticket_notification(db: Session, ticket: Ticket, admin_user: User, reponse_contenu: str = None):
    contenu_text = (
        f"L'administrateur {admin_user.prenom or ''} {admin_user.nom or ''} "
        f"a répondu à votre ticket « {ticket.sujet} »."
    )
    if reponse_contenu:
        contenu_text += f"\n\n{reponse_contenu}"

    notification_service.send_notification(
        db=db,
        utilisateur_id=ticket.patient_id,
        type_notif="reponse_ticket",
        canal="in_app",
        titre="Réponse à votre ticket de support",
        contenu=contenu_text,
        donnees={
            "ticket_id": str(ticket.id),
            "sujet": ticket.sujet,
        },
    )
