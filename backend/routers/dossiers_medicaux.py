from datetime import datetime, timezone
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from access_control import check_dossier_access, get_dossier_access_level
from db import get_db
from models import DossierMedical, Patient, User
from schemas import DossierMedicalCreate, DossierMedicalRead, DossierMedicalUpdate

router = APIRouter(tags=["dossiers_medicaux"])


@router.get("/dossiers_medicaux", response_model=List[DossierMedicalRead])
async def list_dossiers_medicaux(
    medecin_traitant_id: UUID | None = None,
    patient_id: UUID | None = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(DossierMedical)
    if current_user.role == "medecin":
        if patient_id:
            stmt = stmt.where(DossierMedical.patient_id == patient_id)
        else:
            stmt = stmt.where(DossierMedical.medecin_traitant_id == current_user.id)
    elif current_user.role == "patient":
        stmt = stmt.where(DossierMedical.patient_id == current_user.id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if medecin_traitant_id:
        stmt = stmt.where(DossierMedical.medecin_traitant_id == medecin_traitant_id)
    if patient_id:
        stmt = stmt.where(DossierMedical.patient_id == patient_id)

    stmt = stmt.order_by(DossierMedical.created_at.desc()).limit(limit)
    dossiers = db.execute(stmt).scalars().all()

    results = []
    for d in dossiers:
        access = get_dossier_access_level(db, current_user, d.patient_id)
        read = DossierMedicalRead.model_validate(d)
        pat = db.get(Patient, d.patient_id)
        if pat:
            read.groupe_sanguin = pat.groupe_sanguin
        if access == "restricted":
            read.acces_restricted = True
            read.antecedents_familiaux = None
            read.antecedents_personnels = None
            read.antecedents_chirurgicaux = None
            read.antecedents_allergiques = None
            read.antecedents_gyneco = None
            read.habitudes_vie = None
            read.taille_cm = None
            read.poids_kg = None
            read.imc = None
            read.tension_arterielle = None
            read.glycemie_a_jeun = None
            read.vaccinations = None
            read.traitements_chroniques = None
            read.groupe_sanguin = None
        else:
            read.acces_restricted = False
        results.append(read)
    return results


@router.post("/dossiers_medicaux", response_model=DossierMedicalRead, status_code=status.HTTP_201_CREATED)
async def create_dossier_medical(
    dossier_create: DossierMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if not dossier_create.numero_dossier:
        dossier_create.numero_dossier = f"DOS-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid4().hex[:6]}"

    if current_user.role == "patient":
        dossier_create.patient_id = current_user.id
    elif current_user.role == "medecin":
        dossier_create.medecin_traitant_id = current_user.id
        check_dossier_access(db, current_user, dossier_create.patient_id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if not db.get(Patient, dossier_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if dossier_create.medecin_traitant_id:
        medecin = db.get(User, dossier_create.medecin_traitant_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    dossier = DossierMedical(**dossier_create.dict(exclude_unset=True))
    db.add(dossier)
    try:
        db.commit()
        db.refresh(dossier)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de dossier médical"
        if "uq_dossiers_medicaux_numero_dossier" in str(exc.orig):
            detail = "Ce numéro de dossier médical est déjà utilisé"
        elif "uq_dossiers_medicaux_patient_id" in str(exc.orig):
            detail = "Un dossier médical existe déjà pour ce patient"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return dossier


@router.get("/dossiers_medicaux/{dossier_id}", response_model=DossierMedicalRead)
async def read_dossier_medical(
    dossier_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if current_user.role == "patient" and dossier.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin", "patient"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    access = get_dossier_access_level(db, current_user, dossier.patient_id)
    read = DossierMedicalRead.model_validate(dossier)
    pat = db.get(Patient, dossier.patient_id)
    if pat:
        read.groupe_sanguin = pat.groupe_sanguin
    if access == "restricted":
        read.acces_restricted = True
        read.antecedents_familiaux = None
        read.antecedents_personnels = None
        read.antecedents_chirurgicaux = None
        read.antecedents_allergiques = None
        read.antecedents_gyneco = None
        read.habitudes_vie = None
        read.taille_cm = None
        read.poids_kg = None
        read.imc = None
        read.tension_arterielle = None
        read.glycemie_a_jeun = None
        read.vaccinations = None
        read.traitements_chroniques = None
        read.groupe_sanguin = None
    else:
        read.acces_restricted = False
    return read



@router.put("/dossiers_medicaux/{dossier_id}", response_model=DossierMedicalRead)
async def update_dossier_medical(
    dossier_id: UUID,
    dossier_update: DossierMedicalUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")

    if current_user.role == "patient":
        if dossier.patient_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    elif current_user.role == "medecin":
        check_dossier_access(db, current_user, dossier.patient_id)
    elif current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    if dossier_update.patient_id and not db.get(Patient, dossier_update.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if dossier_update.medecin_traitant_id and current_user.role == "admin":
        medecin = db.get(User, dossier_update.medecin_traitant_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    for field, value in dossier_update.dict(exclude_unset=True).items():
        setattr(dossier, field, value)

    db.add(dossier)
    try:
        db.commit()
        db.refresh(dossier)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de dossier médical: {exc.orig}") from exc
    return dossier


@router.delete("/dossiers_medicaux/{dossier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dossier_medical(
    dossier_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if current_user.role == "medecin" and dossier.medecin_traitant_id and dossier.medecin_traitant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    db.delete(dossier)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/dossiers_medicaux/{dossier_id}/request-access")
async def request_dossier_access(
    dossier_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux médecins")
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    access = get_dossier_access_level(db, current_user, dossier.patient_id)
    if access == "full":
        return {"message": "Accès déjà autorisé", "already_authorized": True}
    from models import Notification
    medecin_user = db.get(User, current_user.id)
    medecin_name = f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Un médecin"
    notification = Notification(
        utilisateur_id=dossier.patient_id,
        type="nouveau_message",
        canal="in_app",
        statut="en_attente",
        titre="Demande d'accès au dossier médical",
        contenu=f"{medecin_name} souhaite accéder à votre dossier médical. Autorisez-vous cet accès ?",
        donnees_supplementaires={
            "type": "demande_acces_dossier",
            "medecin_id": str(current_user.id),
            "medecin_nom": medecin_name,
            "dossier_id": str(dossier_id),
        },
    )
    db.add(notification)
    db.commit()
    return {"message": f"Demande envoyée au patient", "already_authorized": False}


@router.post("/dossiers_medicaux/{dossier_id}/accept-access")
async def accept_dossier_access(
    dossier_id: UUID,
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux patients")
    dossier = db.get(DossierMedical, dossier_id)
    if not dossier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dossier médical non trouvé")
    if dossier.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce dossier ne vous appartient pas")

    from models import Medecin, Notification, ProfessionnelAutorise
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")

    existing = db.execute(
        select(ProfessionnelAutorise).where(
            ProfessionnelAutorise.patient_id == current_user.id,
            ProfessionnelAutorise.medecin_id == medecin_id,
        )
    ).scalar_one_or_none()
    if not existing:
        autorisation = ProfessionnelAutorise(
            patient_id=current_user.id,
            medecin_id=medecin_id,
        )
        db.add(autorisation)
    db.commit()
    return {"message": "Accès autorisé", "acces_dossier": "restreint"}
