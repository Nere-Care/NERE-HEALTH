from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import authenticate_user, create_access_token, get_password_hash, validate_password, get_current_active_user
from db import get_db
from limiter import limiter
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
    user = authenticate_user(
        db,
        form_data.username,
        form_data.password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ────────────────────────────────────────────────
    # Vérification du compte médecin
    # ────────────────────────────────────────────────
    if user.role == "medecin":
        medecin = db.get(Medecin, user.id)

        if medecin:
            if medecin.statut_verification == "en_attente":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Votre compte est en cours de vérification "
                        "par notre équipe. Vous recevrez un email dès "
                        "que votre dossier sera validé."
                    ),
                )

            if medecin.statut_verification == "rejete":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Votre dossier n'a pas été validé. "
                        "Veuillez consulter l'email envoyé "
                        "pour connaître la procédure à suivre."
                    ),
                )

    # ────────────────────────────────────────────────
    # Vérification du statut utilisateur
    # ────────────────────────────────────────────────
    if hasattr(user, "statut") and user.statut == "inactif":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Votre compte a été désactivé. "
                "Contactez le support."
            ),
        )

    # ────────────────────────────────────────────────
    # Génération du JWT
    # ────────────────────────────────────────────────
    access_token = create_access_token(
        subject=user.email
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/auth/register", response_model=UserRead)
async def register_user(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):

    validate_password(user_create.password)

    if db.query(User).filter(User.email == user_create.email).first():
        raise HTTPException(400, "Email déjà utilisé")

    hashed_password = get_password_hash(user_create.password)

    role_map = {"patient": "patient", "doctor": "medecin", "nurse": "medecin"}
    db_role = role_map.get(user_create.role, user_create.role)

    # ── Point clé : statut initial selon le role ──────────────────────────
    # Patient : actif immediatement
    # Medecin : en_attente jusqu'a validation admin
    statut_initial = "actif" if db_role == "patient" else "en_attente"

    user = User(
        email=user_create.email,
        prenom=user_create.prenom,
        nom=user_create.nom,
        telephone=user_create.telephone,
        mot_de_passe_hash=hashed_password,
        role=db_role,
        statut=statut_initial,
    )
    db.add(user)
    db.flush()

    if db_role == "patient":
        # Génération du numéro de patient unique requis par la base de données
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
            disponible_maintenant=False,  # invisible dans l'annuaire tant que non verifie
        )
        db.add(medecin)
        db.flush()

        # Stocker les documents justificatifs (plusieurs fichiers)
        if user_create.documents:
            import hashlib, base64
            from models import DocumentMedical

            for doc in user_create.documents:
                try:
                    contenu_bytes = base64.b64decode(doc.contenu_base64)
                    checksum = hashlib.sha256(contenu_bytes).hexdigest()

                    document = DocumentMedical(
                        patient_id=None,
                        uploaded_par=user.id,
                        medecin_uploadeur_id=user.id,
                        type_document="certificat_medical",
                        nom_fichier_original=doc.nom_fichier,
                        nom_fichier_stockage=f"docs_medecins/{user.id}/{checksum[:8]}_{doc.nom_fichier}",
                        url_stockage=f"data:{doc.mime_type};base64,{doc.contenu_base64}",
                        checksum_sha256=checksum,
                        taille_octets=len(contenu_bytes),
                        mime_type=doc.mime_type,
                        est_chiffre=False,
                        visible_patient=False,
                        description="Document justificatif inscription medecin",
                    )
                    db.add(document)
                except Exception:
                    continue

        # Notifier tous les admins qu'un nouveau medecin attend validation
        admins = db.query(User).filter(User.role == "admin").all()
        from models import Notification
        for admin in admins:
            notif = Notification(
                utilisateur_id=admin.id,
                type="nouveaux_avis",
                canal="in_app",
                statut="en_attente",
                titre="Nouveau médecin en attente de validation",
                contenu=f"Dr. {user.prenom} {user.nom} a soumis son dossier d'inscription. Numéro d'ordre : {medecin.numero_ordre}.",
                donnees_supplementaires={
                    "type": "nouvelle_inscription_medecin",
                    "medecin_id": str(user.id),
                },
            )
            db.add(notif)

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




