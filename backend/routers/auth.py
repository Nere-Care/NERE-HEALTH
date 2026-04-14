from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import authenticate_user, create_access_token, get_password_hash, validate_password, get_current_active_user
from db import get_db
from limiter import limiter
from models import User
from schemas import Token, UserCreate, UserRead

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
@limiter.limit("5/minute")
async def register_user(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    validate_password(user_create.password)

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


@router.get("/auth/me", response_model=UserRead)
async def read_current_user(current_user=Depends(get_current_active_user)):
    return current_user
