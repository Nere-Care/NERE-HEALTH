"""
Routes d'authentification JWT avec rotation de tokens - FAILLE #7

Endpoints :
- /auth/token : Login avec création de paire tokens
- /auth/refresh : Rafraîchissement du token d'accès
- /auth/logout : Déconnexion avec révocation des tokens
- /auth/register : Inscription utilisateur
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import (
    authenticate_user,
    create_token_pair,
    get_password_hash,
    refresh_access_token,
    revoke_user_tokens,
    validate_password,
    get_current_active_user_secure,
)
from ..audit_logger import get_audit_logger
from ..db import get_db
from ..jwt_handler import JWTHandler
from ..limiter import auth_limiter
from ..models import User
from ..schemas import Token, UserCreate, UserRead

router = APIRouter(tags=["auth"])


@router.post("/auth/token", response_model=Token)
@auth_limiter.limit("5/minute")  # Anti-brute force: 5 tentatives/minute
async def login_for_access_token(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Authentification utilisateur avec création de paire de tokens.

    Returns:
        access_token: Token d'accès court terme (15 min)
        refresh_token: Token de rafraîchissement long terme (7 jours)
        token_type: "bearer"
        expires_in: Durée d'expiration en secondes
        user: Informations utilisateur
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Logger l'échec d'authentification
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_failure(
            email=form_data.username,
            reason="invalid_credentials",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/token",
            method="POST",
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Créer la paire de tokens
    token_data = create_token_pair(user)

    # Logger la connexion réussie
    audit_logger = get_audit_logger(db)
    audit_logger.log_auth_success(
        user_id=user.id,
        email=user.email,
        role=user.role,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent"),
        endpoint="/auth/token",
        method="POST",
    )

    # Ajouter les tokens aux cookies pour sécurité supplémentaire (optionnel)
    response.set_cookie(
        key="access_token",
        value=token_data["access_token"],
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",
        max_age=JWTHandler.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    response.set_cookie(
        key="refresh_token",
        value=token_data["refresh_token"],
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=JWTHandler.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

    return token_data


@router.post("/auth/refresh", response_model=Token)
@auth_limiter.limit("10/minute")  # Limite raisonnable pour les refresh
async def refresh_access_token_endpoint(
    request: Request,
    response: Response,
    refresh_token: str,  # Dans un vrai système, utiliser un form ou header sécurisé
    db: Session = Depends(get_db),
):
    """
    Rafraîchit le token d'accès en utilisant un refresh token valide.

    Args:
        refresh_token: Token de rafraîchissement

    Returns:
        Nouvelle paire de tokens
    """
    try:
        token_data = refresh_access_token(refresh_token, db, request)

        # Mettre à jour les cookies
        response.set_cookie(
            key="access_token",
            value=token_data["access_token"],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=JWTHandler.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        response.set_cookie(
            key="refresh_token",
            value=token_data["refresh_token"],
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=JWTHandler.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        )

        return token_data

    except HTTPException:
        raise
    except Exception as e:
        # Logger l'erreur
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_failure(
            email="unknown",
            reason=f"Erreur refresh token: {str(e)}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/refresh",
            method="POST",
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du rafraîchissement du token",
        )


@router.post("/auth/logout")
@auth_limiter.limit("20/minute")  # Permettre plusieurs déconnexions
async def logout_user(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_active_user_secure),
    db: Session = Depends(get_db),
):
    """
    Déconnexion utilisateur avec révocation des tokens actifs.

    Révoque tous les tokens de l'utilisateur pour sécurité maximale.
    """
    try:
        # Révoquer tous les tokens de l'utilisateur
        revoked_count = revoke_user_tokens(
            current_user.id,
            db,
            reason="logout",
            request=request,
        )

        # Supprimer les cookies
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        # Logger la déconnexion
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_success(
            user_id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/logout",
            method="POST",
            additional_data={"action": "logout", "tokens_revoked": revoked_count},
        )

        return {"message": "Déconnexion réussie", "tokens_revoked": revoked_count}

    except Exception as e:
        # Logger l'erreur mais ne pas échouer la déconnexion
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_failure(
            email=current_user.email,
            reason=f"Erreur logout: {str(e)}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/logout",
            method="POST",
        )

        # Supprimer quand même les cookies
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        return {"message": "Déconnexion effectuée malgré une erreur interne"}


@router.post("/auth/register", response_model=UserRead)
@auth_limiter.limit("3/minute")  # Anti-abus: 3 inscriptions/minute
async def register_user(
    request: Request,
    user_create: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Inscription d'un nouvel utilisateur.

    Valide le mot de passe et crée un compte utilisateur.
    """
    # Valider le mot de passe
    validate_password(user_create.password)

    # Vérifier les doublons
    if db.query(User).filter(User.email == user_create.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email est déjà utilisé")

    if user_create.telephone and db.query(User).filter(User.telephone == user_create.telephone).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce numéro de téléphone est déjà utilisé")

    # Créer l'utilisateur
    hashed_password = get_password_hash(user_create.password)
    user = User(
        email=user_create.email,
        prenom=user_create.prenom,
        nom=user_create.nom,
        telephone=user_create.telephone,
        mot_de_passe_hash=hashed_password,
        role="patient",  # Rôle par défaut
        statut="en_attente",  # En attente de validation
    )

    db.add(user)
    try:
        db.commit()
        db.refresh(user)

        # Logger l'inscription réussie
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_success(
            user_id=user.id,
            email=user.email,
            role=user.role,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/register",
            method="POST",
            additional_data={"action": "user_registration"},
        )

    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création de l'utilisateur"
        if "uq_users_email" in str(exc.orig):
            detail = "Cet email est déjà utilisé"
        elif "uq_users_telephone" in str(exc.orig):
            detail = "Ce numéro de téléphone est déjà utilisé"

        # Logger l'échec d'inscription
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_failure(
            email=user_create.email,
            reason=f"registration_failed: {detail}",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/register",
            method="POST",
        )

        raise HTTPException(status_code=400, detail=detail) from exc

    return user


@router.get("/auth/me", response_model=UserRead)
async def read_current_user(current_user: User = Depends(get_current_active_user_secure)):
    """
    Récupère les informations de l'utilisateur actuellement authentifié.

    Returns:
        Informations complètes de l'utilisateur
    """
    return current_user


@router.post("/auth/revoke-tokens")
async def revoke_all_user_tokens(
    request: Request,
    current_user: User = Depends(get_current_active_user_secure),
    db: Session = Depends(get_db),
):
    """
    Révoque tous les tokens actifs de l'utilisateur actuel.

    Utile pour :
    - Changement de mot de passe
    - Suspicion de compromission
    - Déconnexion de tous les appareils
    """
    try:
        revoked_count = revoke_user_tokens(
            current_user.id,
            db,
            reason="manual_revoke",
            request=request,
        )

        # Logger l'action
        audit_logger = get_audit_logger(db)
        audit_logger.log_auth_success(
            user_id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent"),
            endpoint="/auth/revoke-tokens",
            method="POST",
            additional_data={"action": "manual_token_revoke", "tokens_revoked": revoked_count},
        )

        return {"message": f"{revoked_count} tokens révoqués avec succès", "tokens_revoked": revoked_count}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la révocation des tokens",
        )
