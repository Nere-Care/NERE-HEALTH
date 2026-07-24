from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import get_db
from models import AnalyseBiologique
from schemas import AnalyseBiologiqueRead
from auth import get_current_active_user

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalyseBiologiqueRead])
async def search_analyses(
    search: str = Query("", min_length=0),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_active_user),
):
    stmt = db.query(AnalyseBiologique)
    if search and len(search) >= 2:
        pattern = f"%{search}%"
        stmt = stmt.filter(
            AnalyseBiologique.nom.ilike(pattern)
            | AnalyseBiologique.categorie.ilike(pattern)
        )
    stmt = stmt.order_by(AnalyseBiologique.nom).limit(limit)
    return stmt.all()
