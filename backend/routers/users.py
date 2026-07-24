from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import User
from schemas import UserRead

router = APIRouter(tags=["users"])


@router.get("/users", response_model=List[UserRead])
async def read_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    users = db.query(User).all()
    return users


@router.get("/users/{user_id}", response_model=UserRead)
async def read_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    if current_user.role not in ("admin",) and current_user.id != user_id and user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return user
