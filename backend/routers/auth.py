from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import secrets
import requests as http_requests

from auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_session,
    decode_access_token,
    get_current_active_user,
    get_password_hash,
    validate_password,
    REFRESH_TOKEN_EXPIRE_HOURS,
)
import hashlib
from config import settings
from db import get_db
from limiter import limiter
from models import User, Session as UserSession, Medecin, MedecinSpecialite, Patient, Specialite, Structure
from schemas import Token, RefreshRequest, UserCreate, UserRead, UserUpdate, PasswordChange, PatientRegister, MedecinRegister
from validators import validate_phone

router = APIRouter(tags=["auth"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


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
    jti = secrets.token_hex(16)
    access_token = create_access_token(subject=user.email, jti=jti)
    refresh_token = create_refresh_token()

    create_session(
        db=db,
        user=user,
        access_token_jti=jti,
        refresh_token=refresh_token,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    user.last_login = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.add(user)
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/auth/refresh", response_model=Token)
@limiter.limit("20/minute")
async def refresh_access_token(
    request: Request,
    body: RefreshRequest,
    db: Session = Depends(get_db),
):
    old_session = (
        db.query(UserSession)
        .filter(UserSession.revoque == False)
        .order_by(UserSession.created_at.desc())
        .all()
    )

    matched_session = None
    token_hash = hashlib.sha256(body.refresh_token.encode("utf-8")).hexdigest()
    for s in old_session:
        if token_hash == s.refresh_token_hash:
            matched_session = s
            break

    if not matched_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalide")

    from datetime import datetime, timezone, timedelta
    if matched_session.expires_at and matched_session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        matched_session.revoque = True
        matched_session.motif_revocation = "expire"
        db.add(matched_session)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée")

    user = db.get(User, matched_session.utilisateur_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Compte inactif")

    matched_session.revoque = True
    matched_session.motif_revocation = "refresh_rotate"
    db.add(matched_session)

    new_jti = secrets.token_hex(16)
    new_refresh = create_refresh_token()
    new_access = create_access_token(subject=user.email, jti=new_jti)

    create_session(
        db=db,
        user=user,
        access_token_jti=new_jti,
        refresh_token=new_refresh,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@router.post("/auth/register", response_model=UserRead)
@limiter.limit("5/minute")
async def register_user(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    validate_password(user_create.password)

    if user_create.telephone:
        try:
            user_create.telephone = validate_phone(user_create.telephone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if db.query(User).filter(User.email == user_create.email).first():
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    if user_create.telephone and db.query(User).filter(User.telephone == user_create.telephone).first():
        raise HTTPException(status_code=400, detail="Ce numéro de téléphone est déjà utilisé")

    hashed_password = get_password_hash(user_create.password)
    user = User(
        email=user_create.email,
        prenom=user_create.prenom,
        nom=user_create.nom,
        telephone=user_create.telephone,
        mot_de_passe_hash=hashed_password,
        role="patient",
        statut="actif",
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de l'utilisateur"
        if "uq_users_email" in str(exc.orig):
            detail = "Cet email est déjà utilisé"
        elif "uq_users_telephone" in str(exc.orig):
            detail = "Ce numéro de téléphone est déjà utilisé"
        raise HTTPException(status_code=400, detail=detail) from exc

    return user


def generer_nss(patient_data, _seed=0):
    import secrets
    s = "1" if patient_data.sexe == "M" else "2"
    if patient_data.date_naissance:
        yy = patient_data.date_naissance.strftime("%y")
        mm = patient_data.date_naissance.strftime("%m")
    else:
        yy = "00"
        mm = "00"
    digits = "".join(str(secrets.randbelow(10)) for _ in range(8))
    return f"{s}{yy}{mm}{digits}"


@router.post("/auth/register/patient", response_model=UserRead)
@limiter.limit("3/minute")
async def register_patient(
    request: Request,
    patient_data: PatientRegister,
    db: Session = Depends(get_db),
):
    validate_password(patient_data.password)

    if patient_data.telephone:
        try:
            patient_data.telephone = validate_phone(patient_data.telephone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if db.query(User).filter(User.email == patient_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé"
        )
    if (
        patient_data.telephone
        and db.query(User).filter(User.telephone == patient_data.telephone).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce numéro de téléphone est déjà utilisé",
        )

    hashed_password = get_password_hash(patient_data.password)
    user = User(
        email=patient_data.email,
        prenom=patient_data.prenom,
        nom=patient_data.nom,
        telephone=patient_data.telephone,
        mot_de_passe_hash=hashed_password,
        role="patient",
        statut="actif",
        date_naissance=patient_data.date_naissance,
        adresse=patient_data.adresse,
    )
    db.add(user)
    db.flush()

    max_retry = 5
    for attempt in range(max_retry):
        nss = generer_nss(patient_data, attempt)
        patient = Patient(
            id=user.id,
            code_patient=f"PAT-{secrets.token_hex(4).upper()}",
            nss=nss,
            sexe=patient_data.sexe or "Non_precise",
            ville=patient_data.ville,
            region=patient_data.region,
            pays=patient_data.pays or "CM",
            contact_urgence_nom=patient_data.contact_urgence_nom,
            contact_urgence_tel=patient_data.contact_urgence_tel,
            consentement_donnees=patient_data.consentement_donnees or False,
        )
        db.add(patient)
        try:
            db.commit()
            db.refresh(user)
            return user
        except IntegrityError as exc:
            db.rollback()
            if "uq_patients_nss" in str(exc.orig) and attempt < max_retry - 1:
                continue
            if "uq_users_email" in str(exc.orig):
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé") from exc
            raise HTTPException(status_code=400, detail="Erreur d'inscription") from exc

    return user


@router.post("/auth/register/medecin", response_model=UserRead)
@limiter.limit("3/minute")
async def register_medecin(
    request: Request,
    medecin_data: MedecinRegister,
    db: Session = Depends(get_db),
):
    validate_password(medecin_data.password)

    if medecin_data.telephone:
        try:
            medecin_data.telephone = validate_phone(medecin_data.telephone)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    if db.query(User).filter(User.email == medecin_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé"
        )
    if (
        medecin_data.telephone
        and db.query(User).filter(User.telephone == medecin_data.telephone).first()
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce numéro de téléphone est déjà utilisé",
        )
    if medecin_data.numero_ordre and db.query(Medecin).filter(Medecin.numero_ordre == medecin_data.numero_ordre).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce numéro d'ordre professionnel est déjà utilisé",
        )

    if medecin_data.date_naissance:
        from datetime import date as _date
        birth = medecin_data.date_naissance
        today = _date.today()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 21:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous devez avoir au moins 21 ans pour vous inscrire en tant que professionnel de santé",
            )

    hashed_password = get_password_hash(medecin_data.password)
    user = User(
        email=medecin_data.email,
        prenom=medecin_data.prenom,
        nom=medecin_data.nom,
        telephone=medecin_data.telephone,
        mot_de_passe_hash=hashed_password,
        role="medecin",
        statut="actif",
        date_naissance=medecin_data.date_naissance,
        adresse=medecin_data.adresse,
    )
    db.add(user)
    db.flush()

    structure_id = None
    if medecin_data.structure_nom:
        structure = db.query(Structure).filter(
            Structure.nom_etablissement.ilike(f"%{medecin_data.structure_nom}%")
        ).first()
        if structure:
            structure_id = structure.id

    medecin = Medecin(
        id=user.id,
        code_medecin=f"MED-{secrets.token_hex(4).upper()}",
        numero_ordre=medecin_data.numero_ordre,
        annees_experience=medecin_data.annees_experience or 0,
        biographie=medecin_data.biographie,
        langues_parlees=medecin_data.langues_parlees or ["fr"],
        tarif_consultation=medecin_data.tarif_consultation or 5000.00,
        structure_id=structure_id,
        ville=medecin_data.ville,
        district=medecin_data.district,
    )
    db.add(medecin)

    if medecin_data.specialites:
        for spec_name in medecin_data.specialites:
            specialty_obj = db.query(Specialite).filter(
                (Specialite.libelle_fr.ilike(f"%{spec_name}%")) |
                (Specialite.libelle_en.ilike(f"%{spec_name}%"))
            ).first()
            if specialty_obj:
                med_spec = MedecinSpecialite(
                    medecin_id=medecin.id,
                    specialite_id=specialty_obj.id,
                )
                db.add(med_spec)

    if structure_id:
        from routers.structures import sync_structure_professionnel_count
        sync_structure_professionnel_count(db, structure_id)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur d'inscription"
        if "uq_users_email" in str(exc.orig):
            detail = "Cet email est déjà utilisé"
        raise HTTPException(status_code=400, detail=detail) from exc

    return user


@router.get("/auth/me", response_model=UserRead)
async def read_current_user(current_user=Depends(get_current_active_user)):
    return current_user


@router.put("/auth/me", response_model=UserRead)
async def update_current_user(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    update_data = user_update.dict(exclude_unset=True)
    if "telephone" in update_data and update_data["telephone"]:
        try:
            update_data["telephone"] = validate_phone(update_data["telephone"])
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.add(current_user)
    try:
        db.commit()
        db.refresh(current_user)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de mise à jour"
        if "uq_users_email" in str(exc.orig):
            detail = "Cet email est déjà utilisé"
        raise HTTPException(status_code=400, detail=detail) from exc
    return current_user


@router.put("/auth/me/password")
async def update_password(
    pw: PasswordChange,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if not authenticate_user(db, current_user.email, pw.old_password):
        raise HTTPException(status_code=401, detail="Ancien mot de passe incorrect")
    validate_password(pw.new_password)
    current_user.mot_de_passe_hash = get_password_hash(pw.new_password)
    db.add(current_user)
    db.commit()
    return {"detail": "Mot de passe modifié avec succès"}


@router.post("/auth/google")
@limiter.limit("10/minute")
async def google_login(request: Request, body: dict, db: Session = Depends(get_db)):
    credential = body.get("credential")
    if not credential:
        raise HTTPException(status_code=400, detail="Token Google manquant")
    desired_role = body.get("role") or None

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth non configuré côté serveur")

    resp = http_requests.get(
        "https://oauth2.googleapis.com/tokeninfo",
        params={"id_token": credential},
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Token Google invalide")

    claims = resp.json()
    audience = claims.get("aud")
    if audience != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Client ID Google invalide")

    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Email non trouvé dans le token Google")

    given_name = claims.get("given_name", "")
    family_name = claims.get("family_name", "")
    picture = claims.get("picture", "")

    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Compte désactivé")
        if picture and not user.photo_url:
            user.photo_url = picture
            db.add(user)
            db.commit()
    elif not desired_role:
        return {
            "needs_role": True,
            "email": email,
            "prenom": given_name or "",
            "nom": family_name or "",
            "photo_url": picture or None,
        }

    if not user:
        valid_roles = {"patient", "medecin", "infirmier", "sage_femme", "structure", "admin", "observateur"}
        if desired_role not in valid_roles:
            raise HTTPException(status_code=400, detail="Rôle invalide")

        user = User(
            email=email,
            prenom=given_name or "",
            nom=family_name or "",
            photo_url=picture or None,
            mot_de_passe_hash=get_password_hash(secrets.token_urlsafe(32)),
            role=desired_role,
            statut="actif",
            email_verifie=True,
        )
        db.add(user)
        db.flush()

        if desired_role == "patient":
            nss = generer_nss(type("obj", (object,), {"sexe": None, "date_naissance": None})(), 0)
            patient = Patient(
                id=user.id,
                code_patient=f"PAT-{secrets.token_hex(4).upper()}",
                nss=nss,
                sexe="Non_precise",
                pays="CM",
            )
            db.add(patient)
        elif desired_role in ("medecin", "infirmier", "sage_femme"):
            medecin = Medecin(
                id=user.id,
                code_medecin=f"DOC-{secrets.token_hex(4).upper()}",
                statut_verification="en_attente",
            )
            db.add(medecin)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Erreur lors de la création du compte")

        db.refresh(user)

    jti = secrets.token_hex(16)
    access_token = create_access_token(subject=user.email, jti=jti)
    refresh_token = create_refresh_token()

    create_session(
        db=db,
        user=user,
        access_token_jti=jti,
        refresh_token=refresh_token,
        ip_address=_get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
