from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import pyotp
import qrcode
import io
import base64
from pydantic import BaseModel

from auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    validate_password,
    get_current_active_user,
    decode_access_token,
    verify_password,
)
from db import get_db
from limiter import limiter
from schemas import Token, UserCreate, UserRead, GoogleAuth
import uuid as uuid_module  # deja importe en haut du fichier normalement

from datetime import datetime, timezone, timedelta
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
    # 1. Authentification de l'utilisateur
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

    # 2. Vérification du compte médecin
    if user.role == "medecin":
        medecin = db.get(Medecin, user.id)

        if medecin:
            if medecin.statut_verification == "en_attente":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Votre compte est en cours de vérification par notre équipe. "
                        "Vous recevrez un email dès que votre dossier sera validé."
                    ),
                )

            if medecin.statut_verification == "rejete":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "Votre dossier n'a pas été validé. "
                        "Veuillez consulter l'email envoyé pour connaître la procédure."
                    ),
                )

    # 3. Vérification du statut utilisateur (Actif / Inactif)
    if hasattr(user, "statut") and user.statut == "inactif":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre compte a été désactivé. Contactez le support.",
        )

    # 4. Traitement 2FA (Si activé)
        # 4. Traitement 2FA (Si activé)
    if getattr(user, "totp_actif", False):
        temp_token = create_access_token(
            subject=user.email,
            expires_delta=timedelta(minutes=5),
            extra_claims={"scope": "2fa_pending"},
        )
        return {
            "requires_2fa": True,
            "temp_token": temp_token,
            "token_type": "bearer",
        }
    
    # 5. Génération du JWT standard (Si pas de 2FA)
    access_token = create_access_token(subject=user.email)

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
        from models import MedecinSpecialite, Specialite
        from sqlalchemy import func as sqlfunc

    # ── Structure : recherche insensible a la casse, creation si introuvable ──
        structure_id = None
        if user_create.hospital and user_create.hospital.strip():
            nom_structure = user_create.hospital.strip()
            structure = db.query(Structure).filter(
                sqlfunc.lower(Structure.nom_etablissement) == nom_structure.lower()
            ).first()

            if structure:
                structure_id = structure.id
            else:
        # La table structures herite de users (meme pattern que patients/medecins)
        # Il faut d'abord creer le User de base avant la Structure
                email_structure = f"structure.{uuid_module.uuid4().hex[:12]}@nere-health.local"

                user_structure = User(
                    id=uuid_module.uuid4(),
                    email=email_structure,
                    mot_de_passe_hash=get_password_hash(str(uuid_module.uuid4())),  # mot de passe aleatoire, compte non utilise pour se connecter
                    role="structure",
                    statut="en_attente",
                    prenom=nom_structure,
                    nom="",
                    email_verifie=False,
                )
                db.add(user_structure)
                db.flush()

                nouvelle_structure = Structure(
                    id=user_structure.id,
                    nom_etablissement=nom_structure,
                    type="clinique",
                    statut_verification="en_attente",
                    adresse="Non renseignee",
                    ville=user_create.city or "Non renseignee",
                    pays="CM",
                )
                db.add(nouvelle_structure)
                db.flush()
                structure_id = nouvelle_structure.id

        medecin = Medecin(
            id=user.id,
            numero_ordre=user_create.registration_number or f"TEMP-{str(user.id)[:8].upper()}",
            statut_verification="en_attente",
            annees_experience=user_create.experience or 0,
            tarif_consultation=5000,
            structure_id=structure_id,
            disponible_maintenant=False,
        )
        db.add(medecin)
        db.flush()

    # ── Specialite : recherche insensible a la casse ──────────────────────────
        if user_create.speciality and user_create.speciality.strip():
            nom_specialite = user_create.speciality.strip()
            specialite_obj = db.query(Specialite).filter(
                sqlfunc.lower(Specialite.libelle_fr) == nom_specialite.lower()
            ).first()

            if specialite_obj:
                medecin_specialite = MedecinSpecialite(
                    medecin_id=medecin.id,
                    specialite_id=specialite_obj.id,
                    principale=True,
                    annees_pratique=user_create.experience or 0,
                    certifie=False,
                )
                db.add(medecin_specialite)
            else:
                print(f"[REGISTER] Specialite '{nom_specialite}' introuvable en base — non liee au medecin {user.email}")

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
                    print(f"[REGISTER] Erreur lors du traitement du document {doc.nom_fichier}")
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





@router.post("/auth/2fa/setup")
async def setup_2fa(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Genere un secret TOTP et un QR code pour activer la 2FA."""
    if current_user.totp_actif:
        raise HTTPException(400, "La double authentification est deja activee")

    if not current_user.totp_secret:
        current_user.totp_secret = pyotp.random_base32()
        db.commit()

    # 🔍 DEBUG TEMPORAIRE
    print(f"[2FA SETUP DEBUG] appel à {datetime.utcnow().isoformat()} — secret utilisé={current_user.totp_secret}")

    totp = pyotp.TOTP(current_user.totp_secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="NERE Health")

    qr = qrcode.make(uri)
    buffer = io.BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "secret_manuel": current_user.totp_secret,
    }

class Code2FA(BaseModel):
    code: str

@router.post("/auth/2fa/activer")
async def activer_2fa(
    payload: Code2FA,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Confirme l'activation de la 2FA en verifiant un premier code."""
    if not current_user.totp_secret:
        raise HTTPException(400, "Veuillez d'abord generer un QR code (/auth/2fa/setup)")

    totp = pyotp.TOTP(current_user.totp_secret)

    # 🔍 DEBUG TEMPORAIRE — à retirer une fois le bug confirmé
    print(f"[2FA DEBUG] secret={current_user.totp_secret}")
    print(f"[2FA DEBUG] code reçu={payload.code}")
    print(f"[2FA DEBUG] code attendu maintenant={totp.now()}")
    print(f"[2FA DEBUG] heure serveur UTC={datetime.utcnow().isoformat()}")

    if not totp.verify(payload.code, valid_window=4):
        raise HTTPException(400, "Code invalide. Verifiez votre application d'authentification.")

    current_user.totp_actif = True
    db.commit()

    return {"message": "Double authentification activee avec succes"}

class DesactiverTOTP(BaseModel):
    password: str

@router.post("/auth/2fa/desactiver")
async def desactiver_2fa(
    payload: DesactiverTOTP,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Desactive la 2FA — necessite le mot de passe pour confirmer."""
    if not verify_password(payload.password, current_user.mot_de_passe_hash):
        raise HTTPException(401, "Mot de passe incorrect")

    current_user.totp_actif = False
    current_user.totp_secret = None
    db.commit()

    return {"message": "Double authentification desactivee"}


class Verifier2FA(BaseModel):
    temp_token: str
    code: str

@router.post("/auth/2fa/verifier", response_model=Token)
async def verifier_2fa_login(
    payload: Verifier2FA,
    db: Session = Depends(get_db),
):
    """Deuxieme etape de connexion : verifie le code TOTP et delivre le vrai token."""
    try:
        claims = decode_access_token(payload.temp_token)
    except Exception:
        raise HTTPException(401, "Session de connexion expiree, veuillez vous reconnecter")

    if claims.get("scope") != "2fa_pending":
        raise HTTPException(401, "Token invalide pour cette operation")

    user = db.query(User).filter(User.email == claims.get("sub")).first()
    if not user or not user.totp_secret:
        raise HTTPException(401, "Utilisateur introuvable")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code, valid_window=4):
        raise HTTPException(400, "Code de verification incorrect")

    access_token = create_access_token(subject=user.email)
    return {"access_token": access_token, "token_type": "bearer"}
