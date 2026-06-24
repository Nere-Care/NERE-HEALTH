from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import authenticate_user, create_access_token, get_password_hash, validate_password, get_current_active_user
from db import get_db
from limiter import limiter
from models import User
from schemas import Token, UserCreate, UserRead, GoogleAuth
import uuid as uuid_module
from datetime import datetime
from models import User, Patient, Medecin, Structure, DossierMedical


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

GOOGLE_CLIENT_ID = "370116629692-j2f64k7n783qus34pv23la583g7vag22.apps.googleusercontent.com"

router = APIRouter(tags=["auth"])


@router.post("/auth/token", response_model=Token)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/register", response_model=UserRead)
async def register_user(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):

    validate_password(user_create.password)

    if db.query(User).filter(User.email == user_create.email).first():
        raise HTTPException(400, "Email déjà utilisé")

    hashed_password = get_password_hash(user_create.password)

    role_map = {
        "patient": "patient",
        "doctor": "medecin",
        "nurse": "medecin",
    }
    db_role = role_map.get(user_create.role, user_create.role)

    user = User(
        email=user_create.email,
        prenom=user_create.prenom,
        nom=user_create.nom,
        telephone=user_create.telephone,
        mot_de_passe_hash=hashed_password,
        role=db_role,
        statut="actif",
    )

    db.add(user)
    db.flush()

    if db_role == "patient":
        numero_patient = f"NER-{datetime.utcnow().year}-{str(user.id)[:8].upper()}"
        patient = Patient(
            id=user.id,
            numero_patient=numero_patient,
            ville=user_create.city,
            region=user_create.district,
            pays="CM",
            consentement_donnees=True,
        )
        db.add(patient)
        db.flush() 
        dossier = DossierMedical(
            numero_dossier=f"DM-{datetime.utcnow().year}-{str(user.id)[:8].upper()}",
            patient_id=patient.id,
       )
        db.add(dossier)

    elif db_role == "medecin":
        structure_id = None
        if user_create.hospital:
            structure = db.query(Structure).filter(
                Structure.nom_etablissement == user_create.hospital
            ).first()
            if structure:
                structure_id = structure.id

        medecin = Medecin(
            id=user.id,
            numero_ordre=user_create.registration_number or f"TEMP-{str(user.id)[:8].upper()}",
            statut_verification="en_attente",
            annees_experience=user_create.experience or 0,
            tarif_consultation=5000,
            structure_id=structure_id,
        )
        db.add(medecin)

    db.commit()
    db.refresh(user)

    return user


@router.post("/auth/google", response_model=Token)
async def google_login(payload: GoogleAuth, db: Session = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Token Google invalide")

    email = idinfo.get("email")
    email_verifie = idinfo.get("email_verified", False)
    prenom = idinfo.get("given_name", "")
    nom = idinfo.get("family_name", "")

    if not email or not email_verifie:
        raise HTTPException(status_code=401, detail="Email Google non vérifié")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Nouveau compte -> patient par défaut
        user = User(
            email=email,
            prenom=prenom or "Utilisateur",
            nom=nom or "Google",
            mot_de_passe_hash=get_password_hash(str(uuid_module.uuid4())),  # mot de passe aléatoire inutilisable
            role="patient",
            statut="actif",
            email_verifie=True,
        )
        db.add(user)
        db.flush()

        numero_patient = f"NER-{datetime.utcnow().year}-{str(user.id)[:8].upper()}"
        patient = Patient(
            id=user.id,
            numero_patient=numero_patient,
            pays="CM",
            consentement_donnees=True,
        )
        db.add(patient)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/auth/me", response_model=UserRead)
async def read_current_user(current_user=Depends(get_current_active_user)):
    return current_user
