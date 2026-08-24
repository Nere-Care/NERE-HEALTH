import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select, union_all
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from auth import get_current_active_user, get_password_hash, require_role
from access_control import check_dossier_access, get_dossier_access_level
from db import get_db
from models import Consultation, DossierMedical, Patient, RendezVous, User, Paiement
from schemas import PatientCreate, PatientRead, PatientUpdate
from validators import validate_phone

router = APIRouter(tags=["patients"])

_DEFAULT_TZ = "Africa/Douala"

_ANTECEDENT_COLS = [
    DossierMedical.antecedents_familiaux,
    DossierMedical.antecedents_personnels,
    DossierMedical.antecedents_chirurgicaux,
    DossierMedical.antecedents_allergiques,
    DossierMedical.antecedents_gyneco,
]


def _patient_ids_with_antecedents(db: Session) -> List[str]:
    from sqlalchemy import or_
    stmt = (
        db.query(DossierMedical.patient_id)
        .filter(or_(*[col.isnot(None) & (col != "") for col in _ANTECEDENT_COLS]))
        .distinct()
    )
    return [str(row[0]) for row in stmt.all()]


def _jour_utc_bornes(tz_name: str = _DEFAULT_TZ):
    local_tz = ZoneInfo(tz_name)
    now_local = datetime.now(local_tz)
    debut_local = datetime(now_local.year, now_local.month, now_local.day, tzinfo=local_tz)
    fin_local = debut_local + timedelta(days=1)
    return debut_local.astimezone(timezone.utc), fin_local.astimezone(timezone.utc)


@router.get("/patients/stats")
async def patients_stats(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    rows = (
        db.query(Patient.id, User.statut, User.last_login, Patient.groupe_sanguin)
        .join(User, Patient.id == User.id)
        .all()
    )
    patient_ids = [str(r.id) for r in rows]
    total = len(patient_ids)

    actifs = [str(r.id) for r in rows if r.statut == "actif"]

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    recents = [str(r.id) for r in rows if r.last_login and r.last_login >= cutoff]

    a_surveiller_ids = set(_patient_ids_with_antecedents(db))
    a_surveiller = [pid for pid in patient_ids if pid in a_surveiller_ids]

    dossiers = {str(d.patient_id): d for d in db.query(DossierMedical).all()}
    dossiers_incomplets = []
    for r in rows:
        pid = str(r.id)
        dossier = dossiers.get(pid)
        if dossier is None:
            dossiers_incomplets.append(pid)
            continue
        has_vitals = dossier.taille_cm is not None and dossier.poids_kg is not None
        has_antecedents = any(
            getattr(dossier, col.name) for col in _ANTECEDENT_COLS
        )
        groupe_connu = r.groupe_sanguin not in (None, "Inconnu", "")
        if not has_vitals or not has_antecedents or not groupe_connu:
            dossiers_incomplets.append(pid)

    debut_utc, fin_utc = _jour_utc_bornes()
    cons_ids = set(
        str(row[0])
        for row in db.query(Consultation.patient_id)
        .filter(
            Consultation.date_heure_debut >= debut_utc,
            Consultation.date_heure_debut < fin_utc,
        )
        .all()
    )
    consultations_aujourdhui = [pid for pid in patient_ids if pid in cons_ids]

    return {
        "total": total,
        "actifs": len(actifs),
        "recents": len(recents),
        "a_surveiller": len(a_surveiller),
        "dossiers_incomplets": len(dossiers_incomplets),
        "consultations_aujourdhui": len(consultations_aujourdhui),
        "actifs_patient_ids": actifs,
        "recents_patient_ids": recents,
        "a_surveiller_patient_ids": a_surveiller,
        "dossiers_incomplets_patient_ids": dossiers_incomplets,
        "consultations_aujourdhui_patient_ids": consultations_aujourdhui,
    }


@router.get("/patients/critiques")
async def list_patients_critiques(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient_ids = _patient_ids_with_antecedents(db)
    return {"count": len(patient_ids), "patient_ids": patient_ids}


class DoctorCreatePatientRequest(BaseModel):
    email: EmailStr
    prenom: str
    nom: str
    telephone: Optional[str] = None
    nss: Optional[str] = None
    date_naissance: Optional[str] = None
    sexe: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None


class DoctorCreatePatientResponse(BaseModel):
    id: UUID
    email: str
    prenom: str
    nom: str
    code_patient: str
    mot_de_passe: str


@router.get("/patients", response_model=List[PatientRead])
async def read_patients(
    limit: int = Query(20, gt=0, le=200),
    search: Optional[str] = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    stmt = (
        db.query(Patient, User)
        .join(User, Patient.id == User.id)
    )

    if mine and current_user.role == "medecin":
        patient_ids_subq = union_all(
            select(RendezVous.patient_id).where(RendezVous.medecin_id == current_user.id),
            select(Consultation.patient_id).where(Consultation.medecin_id == current_user.id),
            select(DossierMedical.patient_id).where(DossierMedical.medecin_traitant_id == current_user.id),
            select(Paiement.patient_id).where(Paiement.medecin_id == str(current_user.id)),
        ).subquery()
        stmt = stmt.filter(Patient.id.in_(select(patient_ids_subq.c.patient_id)))

    if search:
        q = f"%{search}%"
        stmt = stmt.filter(
            (User.nom.ilike(q))
            | (User.prenom.ilike(q))
            | (User.email.ilike(q))
            | (Patient.nss.ilike(q))
        )
    results = stmt.limit(limit).all()

    patients = []
    for patient, user in results:
        read = PatientRead.model_validate(patient)
        read.nom = user.nom
        read.prenom = user.prenom
        read.email = user.email
        read.telephone = user.telephone
        read.photo_url = user.photo_url
        read.date_naissance = user.date_naissance
        read.adresse = user.adresse
        patients.append(read)
    return patients


@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_create: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
        detail="Utilisez /patients/create-by-doctor pour créer un patient avec un compte utilisateur.")


@router.post("/patients/create-by-doctor", response_model=DoctorCreatePatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_by_doctor(
    req: DoctorCreatePatientRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")
    if req.telephone:
        try:
            req.telephone = validate_phone(req.telephone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    if req.telephone and db.query(User).filter(User.telephone == req.telephone).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce numéro de téléphone est déjà utilisé")

    mot_de_passe = secrets.token_urlsafe(8)
    hashed_password = get_password_hash(mot_de_passe)

    date_naissance = None
    if req.date_naissance:
        try:
            from datetime import date as _date
            date_naissance = _date.fromisoformat(req.date_naissance)
        except ValueError:
            pass

    user = User(
        email=req.email,
        prenom=req.prenom,
        nom=req.nom,
        telephone=req.telephone,
        mot_de_passe_hash=hashed_password,
        role="patient",
        statut="actif",
        date_naissance=date_naissance,
        adresse=req.adresse,
    )
    db.add(user)
    db.flush()

    max_retry = 5
    for attempt in range(max_retry):
        if req.nss:
            nss = req.nss
        else:
            s = "1" if req.sexe == "M" else "2"
            if date_naissance:
                yy = date_naissance.strftime("%y")
                mm = date_naissance.strftime("%m")
            else:
                yy = "00"
                mm = "00"
            digits = "".join(str(random.randint(0, 9)) for _ in range(8))
            nss = f"{s}{yy}{mm}{digits}"

        patient = Patient(
            id=user.id,
            code_patient=f"PAT-{secrets.token_hex(4).upper()}",
            nss=nss,
            sexe=req.sexe or "Non_precise",
            ville=req.ville,
            pays="CM",
        )
        db.add(patient)
        try:
            db.commit()
            db.refresh(user)
            return DoctorCreatePatientResponse(
                id=user.id,
                email=user.email,
                prenom=user.prenom or "",
                nom=user.nom or "",
                code_patient=patient.code_patient,
                mot_de_passe=mot_de_passe,
            )
        except IntegrityError as exc:
            db.rollback()
            if "uq_patients_nss" in str(exc.orig) and attempt < max_retry - 1:
                continue
            if "uq_users_email" in str(exc.orig):
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé") from exc
            raise HTTPException(status_code=400, detail="Erreur de création du patient") from exc

    raise HTTPException(status_code=500, detail="Impossible de créer le patient après plusieurs tentatives")


@router.get("/patients/{patient_id}", response_model=PatientRead)
async def read_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin") and current_user.id != patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")
    user = db.get(User, patient_id)
    read = PatientRead.model_validate(patient)
    if user:
        read.nom = user.nom
        read.prenom = user.prenom
        read.email = user.email
        read.telephone = user.telephone
        read.photo_url = user.photo_url
        read.date_naissance = user.date_naissance
        read.adresse = user.adresse
    access_restricted = False
    if current_user.role == "medecin" and current_user.id != patient_id:
        level = get_dossier_access_level(db, current_user, patient_id)
        if level == "restricted":
            access_restricted = True
    read.acces_restricted = access_restricted
    if not access_restricted:
        dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == patient_id).first()
        if dossier:
            read.taille_cm = float(dossier.taille_cm) if dossier.taille_cm else None
            read.poids_kg = float(dossier.poids_kg) if dossier.poids_kg else None
    if not read.proches and (read.proche_nom or read.proche_prenom):
        read.proches = [{"nom": read.proche_nom or "", "prenom": read.proche_prenom or "", "age": read.proche_age}]
    return read


@router.put("/patients/{patient_id}", response_model=PatientRead)
async def update_patient(
    patient_id: UUID,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin") and current_user.id != patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "medecin" and current_user.id != patient_id:
        check_dossier_access(db, current_user, patient_id)
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")

    dossier_fields = {}
    for field, value in patient_update.dict(exclude_unset=True).items():
        if field in ("adresse", "date_naissance"):
            continue
        if field in ("taille_cm", "poids_kg"):
            dossier_fields[field] = value
            continue
        setattr(patient, field, value)

    if patient_update.proches is not None:
        patient.proches = list(patient_update.proches)
        flag_modified(patient, "proches")
    elif patient_update.proche_nom or patient_update.proche_prenom:
        new_pr = {
            "nom": patient_update.proche_nom or patient.proche_nom or "",
            "prenom": patient_update.proche_prenom or patient.proche_prenom or "",
            "age": patient_update.proche_age if patient_update.proche_age is not None else patient.proche_age,
        }
        existing = list(patient.proches or [])
        if not any(p.get("nom") == new_pr["nom"] and p.get("prenom") == new_pr["prenom"] for p in existing):
            existing.append(new_pr)
        patient.proches = list(existing)
        flag_modified(patient, "proches")

    user = db.get(User, patient_id)
    if user:
        if patient_update.adresse is not None:
            user.adresse = patient_update.adresse
        if patient_update.date_naissance is not None:
            user.date_naissance = patient_update.date_naissance

    db.add(patient)

    if dossier_fields:
        dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == patient_id).first()
        if not dossier:
            import secrets as _secrets
            dossier = DossierMedical(
                numero_dossier=f"DM-{_secrets.token_hex(4).upper()}",
                patient_id=patient_id,
            )
            db.add(dossier)
            db.flush()
        for field, value in dossier_fields.items():
            setattr(dossier, field, value)
        db.add(dossier)

    try:
        db.commit()
        db.refresh(patient)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour: {exc.orig}") from exc

    read = PatientRead.model_validate(patient)
    if user:
        read.nom = user.nom
        read.prenom = user.prenom
        read.email = user.email
        read.telephone = user.telephone
        read.photo_url = user.photo_url
        read.date_naissance = user.date_naissance
        read.adresse = user.adresse
    if dossier_fields:
        dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == patient_id).first()
        if dossier:
            read.taille_cm = float(dossier.taille_cm) if dossier.taille_cm else None
            read.poids_kg = float(dossier.poids_kg) if dossier.poids_kg else None
    return read


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")
    user = db.get(User, patient_id)
    if user:
        user.statut = "supprime"
        db.add(user)
    db.delete(patient)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/admin/patients/{patient_id}/status")
async def update_patient_status(
    patient_id: UUID,
    status_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.get(User, patient_id)
    if not user or user.role != "patient":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")

    new_status = status_data.get("statut")
    if new_status not in ("actif", "suspendu", "banni", "inactif"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Statut invalide")

    user.statut = new_status
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"statut": user.statut}
