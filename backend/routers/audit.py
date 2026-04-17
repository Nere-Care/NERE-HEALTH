from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from auth import require_role
from db import get_db
from models import AuditLog
from schemas import AuditLogRead

router = APIRouter(tags=["audit"])


@router.get("/audit/logs", response_model=List[AuditLogRead])
async def read_audit_logs(
    limit: int = Query(50, gt=0, le=200),
    entite_type: Optional[str] = None,
    entite_id: Optional[str] = None,
    action: Optional[str] = None,
    utilisateur_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    stmt = select(AuditLog)
    if entite_type:
        stmt = stmt.where(AuditLog.entite_type == entite_type)
    if entite_id:
        stmt = stmt.where(AuditLog.entite_id == entite_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if utilisateur_id:
        stmt = stmt.where(AuditLog.utilisateur_id == utilisateur_id)
    stmt = stmt.order_by(AuditLog.created_at.desc()).limit(limit)
    audits = db.execute(stmt).scalars().all()
    return audits


@router.get("/audit/logs/{audit_id}", response_model=AuditLogRead)
async def read_audit_log(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    audit = db.get(AuditLog, audit_id)
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrée d'audit non trouvée")
    return audit
