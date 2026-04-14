from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_role
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
