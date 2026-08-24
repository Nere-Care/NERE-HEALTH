from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import secrets
import requests as http_requests
from datetime import datetime, timedelta, timezone

from auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    create_session,
    create_twofa_token,
    decode_access_token,
    decode_twofa_token,
    get_block_remaining_seconds,
    get_current_active_user,
    get_password_hash,
    get_user_by_email,
    new_totp_secret,
    new_verification_credentials,
    register_failed_login,
    reset_login_attempts,
    validate_password,
    verify_email_by_code,
    verify_email_by_token,
    verify_password,
    verify_totp,
    LOGIN_BLOCK_MINUTES,
    REFRESH_TOKEN_EXPIRE_HOURS,
)
import hashlib
import pyotp
from config import settings
from db import get_db
from email_service import (
    email_enabled,
    send_2fa_disabled_email,
    send_2fa_enabled_email,
    send_password_changed_email,
    send_reset_password_email,
    send_verification_email,
)

_COOKIE_SECURE = not settings.DEBUG  # False en dev HTTP, True en prod HTTPS
_COOKIE_SAMESITE = "lax"
from limiter import limiter, resend_key_func
from slowapi.util import get_remote_address
from models import User, Session as UserSession, Medecin, MedecinSpecialite, Patient, Specialite, Structure
from schemas import (
    Token,
    RefreshRequest,
    UserCreate,
    UserRead,
    UserUpdate,
    PasswordChange,
    PatientRegister,
    MedecinRegister,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TwoFactorCodeRequest,
    TwoFactorVerifyRequest,
    VerifyEmailCodeRequest,
    VerifyEmailRequest,
)
from validators import validate_phone

router = APIRouter(tags=["auth"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _frontend_base_url(request: Request) -> str:
    """URL du frontend utilisée pour les liens d'emails.

    Priorité : l'en-tête Origin (l'URL exacte que le navigateur a utilisée),
    sinon Host + schéma (X-Forwarded-Proto si derrière un proxy TLS),
    sinon FRONTEND_URL du settings (fallback). Permet de fonctionner
    quelle que soit l'adresse IP / le domaine utilisé pour accéder au site.
    """
    origin = request.headers.get("origin")
    if origin:
        return origin.rstrip("/")
    host = request.headers.get("host")
    if host:
        scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "http"
        return f"{scheme}://{host}".rstrip("/")
    return settings.FRONTEND_URL


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Store tokens in httpOnly cookies and a JS-readable marker (no token) for auth state."""
    response.set_cookie(
        key="access_token", value=access_token,
        httponly=True, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )
    response.set_cookie(
        key="refresh_token", value=refresh_token,
        httponly=True, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )
    response.set_cookie(
        key="nere_authed", value="1",
        httponly=False, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key="access_token", httponly=True, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="refresh_token", httponly=True, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key="nere_authed", httponly=False, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE,
    )


def _init_email_verification(db: Session, user: User) -> None:
    """Génère le jeton + code de confirmation d'email pour un nouveau compte."""
    new_verification_credentials(user)
    db.add(user)
    db.commit()
    db.refresh(user)


def _send_verification_email_or_dev(request: Request, user: User) -> dict:
    """Envoie l'email de confirmation, ou renvoie jeton + code (mode dev)."""
    if email_enabled():
        send_verification_email(
            user.email,
            user.prenom or user.nom or "cher utilisateur",
            user.email_verification_token,
            user.email_otp,
            base_url=_frontend_base_url(request),
        )
        return {}
    return {
        "dev_verification_token": user.email_verification_token,
        "dev_verification_code": user.email_otp,
    }


def _register_response(request: Request, user: User) -> dict:
    """Réponse d'inscription : données utilisateur + infos de vérif en mode dev."""
    base = UserRead.model_validate(user).model_dump()
    base.update(_send_verification_email_or_dev(request, user))
    return base


def _totp_qr_base64(otpauth_url: str) -> str:
    import base64
    import io
    import qrcode
    qr = qrcode.make(otpauth_url)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")


@router.post("/auth/token", response_model=Token)
@limiter.limit("10/minute, 20/hour")
async def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    existing_user = get_user_by_email(db, form_data.username)

    if existing_user:
        remaining = get_block_remaining_seconds(existing_user)
        if remaining is not None:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Trop de tentatives. Compte bloqué, réessayez dans {int(remaining // 60) + 1} min.",
            )

    password_ok = bool(existing_user) and verify_password(
        form_data.password, existing_user.hashed_password
    )

    if existing_user and password_ok:
        if not existing_user.email_verifie:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "EMAIL_NOT_VERIFIED",
                    "message": "Veuillez confirmer votre adresse email avant de vous connecter. "
                    "Un lien et un code vous ont été envoyés.",
                },
            )
        if existing_user.statut in ("banni", "inactif", "supprime"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte désactivé ou suspendu",
            )

    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        if existing_user:
            register_failed_login(db, existing_user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.totp_actif:
        return {
            "access_token": "",
            "refresh_token": None,
            "token_type": "bearer",
            "requires_2fa": True,
            "totp_token": create_twofa_token(user.email),
        }

    reset_login_attempts(db, user)
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

    _set_auth_cookies(response, access_token, refresh_token)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/auth/forgot-password")
@limiter.limit("3/15 minutes, 5/hour")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Generate a reset token. Réponse générique pour éviter l'énumération des comptes."""
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user:
        user.reset_password_token = secrets.token_urlsafe(32)
        user.reset_password_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        db.add(user)
        db.commit()
        db.refresh(user)
        if email_enabled():
            send_reset_password_email(
                user.email,
                user.prenom or user.nom or "cher utilisateur",
                user.reset_password_token,
                base_url=_frontend_base_url(request),
            )
            return {"detail": "Si l'email existe, un lien de réinitialisation a été envoyé."}
        # Mode dev : pas de SMTP → on renvoie le jeton pour pouvoir tester.
        return {
            "detail": "Si l'email existe, un lien de réinitialisation a été envoyé.",
            "reset_token": user.reset_password_token,
        }

    return {"detail": "Si l'email existe, un lien de réinitialisation a été envoyé."}


@router.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.reset_password_token == body.token, User.reset_password_token_expires.isnot(None))
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Jeton invalide ou expiré")

    expires = user.reset_password_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Jeton invalide ou expiré")

    validate_password(body.new_password)

    user.mot_de_passe_hash = get_password_hash(body.new_password)
    user.reset_password_token = None
    user.reset_password_token_expires = None
    user.nb_tentatives_connexion = 0
    user.bloque_jusqu_a = None
    db.add(user)
    db.commit()

    return {"detail": "Mot de passe réinitialisé avec succès"}


# ── Vérification d'email ──────────────────────────────────────────────────


@router.post("/auth/verify-email")
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    body: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    user = verify_email_by_token(db, body.token.strip())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lien de confirmation invalide ou expiré",
        )
    return {
        "detail": "Adresse email confirmée avec succès",
        "email": user.email,
        "role": user.role,
    }


@router.post("/auth/verify-email-code")
@limiter.limit("10/minute")
async def verify_email_code(
    request: Request,
    body: VerifyEmailCodeRequest,
    db: Session = Depends(get_db),
):
    user = verify_email_by_code(db, body.email.strip().lower(), body.code.strip())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code de confirmation invalide ou expiré",
        )
    return {
        "detail": "Adresse email confirmée avec succès",
        "email": user.email,
        "role": user.role,
    }


@router.post("/auth/resend-verification")
@limiter.limit("3/15 minutes, 5/hour", key_func=resend_key_func)
@limiter.limit("30/hour", key_func=get_remote_address)
async def resend_verification(
    request: Request,
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
):
    """Renvoie l'email de confirmation. Réponse générique (pas d'énumération)."""
    email = (body.email or "").strip().lower()
    token = (body.token or "").strip()

    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()
    elif token:
        user = db.query(User).filter(User.email_verification_token == token).first()

    if user and not user.email_verifie:
        _init_email_verification(db, user)
        dev = _send_verification_email_or_dev(request, user)
        if dev:
            return {"detail": "Un nouveau lien de confirmation a été envoyé.", **dev}

    return {"detail": "Si l'email existe et n'est pas confirmé, un nouveau lien vous a été envoyé."}


# ── Double authentification (TOTP) ────────────────────────────────────────


@router.post("/auth/verify-2fa", response_model=Token)
@limiter.limit("5/minute")
async def verify_twofa(
    request: Request,
    response: Response,
    body: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
):
    email = decode_twofa_token(body.totp_token.strip())
    user = get_user_by_email(db, email)
    if not user or not user.totp_actif:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session 2FA invalide")

    if not verify_totp(user, body.code.strip()):
        register_failed_login(db, user)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Code de vérification incorrect",
        )

    reset_login_attempts(db, user)
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

    user.last_login = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    _set_auth_cookies(response, access_token, refresh_token)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/auth/2fa/setup")
async def twofa_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.totp_actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La double authentification est déjà activée",
        )
    secret = new_totp_secret()
    current_user.totp_secret = secret
    db.add(current_user)
    db.commit()
    otpauth_url = pyotp.TOTP(secret).provisioning_uri(
        name=current_user.email, issuer_name="Néré Health"
    )
    return {
        "secret": secret,
        "otpauth_url": otpauth_url,
        "qr_code": _totp_qr_base64(otpauth_url),
    }


@router.post("/auth/2fa/enable")
@limiter.limit("10/minute")
async def twofa_enable(
    request: Request,
    body: TwoFactorCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun secret 2FA en attente. Demandez un nouveau code QR d'abord.",
        )
    if not verify_totp(current_user, body.code.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code de vérification incorrect",
        )
    current_user.totp_actif = True
    db.add(current_user)
    db.commit()
    send_2fa_enabled_email(
        current_user.email, current_user.prenom or current_user.nom or "cher utilisateur"
    )
    return {"detail": "Double authentification activée", "totp_actif": True}


@router.post("/auth/2fa/disable")
@limiter.limit("10/minute")
async def twofa_disable(
    request: Request,
    body: TwoFactorCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.totp_actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La double authentification n'est pas activée",
        )
    if not verify_totp(current_user, body.code.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code de vérification incorrect",
        )
    current_user.totp_actif = False
    current_user.totp_secret = None
    db.add(current_user)
    db.commit()
    send_2fa_disabled_email(
        current_user.email, current_user.prenom or current_user.nom or "cher utilisateur"
    )
    return {"detail": "Double authentification désactivée", "totp_actif": False}


@router.post("/auth/refresh", response_model=Token)
@limiter.limit("20/minute")
async def refresh_access_token(
    request: Request,
    response: Response,
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

    _set_auth_cookies(response, new_access, new_refresh)
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@router.post("/auth/register")
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
        statut="en_attente",
        email_verifie=False,
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

    _init_email_verification(db, user)
    return _register_response(request, user)


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


@router.post("/auth/register/patient")
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
        statut="en_attente",
        email_verifie=False,
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
            _init_email_verification(db, user)
            return _register_response(request, user)
        except IntegrityError as exc:
            db.rollback()
            if "uq_patients_nss" in str(exc.orig) and attempt < max_retry - 1:
                continue
            if "uq_users_email" in str(exc.orig):
                raise HTTPException(status_code=400, detail="Cet email est déjà utilisé") from exc
            raise HTTPException(status_code=400, detail="Erreur d'inscription") from exc

    return _register_response(request, user)


@router.post("/auth/register/medecin")
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
        statut="en_attente",
        email_verifie=False,
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

    _init_email_verification(db, user)
    return _register_response(request, user)


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
    send_password_changed_email(
        current_user.email, current_user.prenom or current_user.nom or "cher utilisateur"
    )
    return {"detail": "Mot de passe modifié avec succès"}


@router.post("/auth/google")
@limiter.limit("10/minute")
async def google_login(request: Request, response: Response, body: dict, db: Session = Depends(get_db)):
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
        # Google vérifie l'email lui-même : un compte préexistant non confirmé est validé.
        if not user.email_verifie:
            user.email_verifie = True
            user.statut = "actif"
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
                numero_ordre="",
                statut_verification="en_attente",
            )
            db.add(medecin)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Erreur lors de la création du compte")

        db.refresh(user)

    if user.totp_actif:
        return {
            "access_token": "",
            "refresh_token": None,
            "token_type": "bearer",
            "requires_2fa": True,
            "totp_token": create_twofa_token(user.email),
        }

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

    _set_auth_cookies(response, access_token, refresh_token)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/auth/logout")
async def logout(response: Response):
    _clear_auth_cookies(response)
    return {"detail": "Déconnecté"}
