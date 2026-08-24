from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse

from auth import get_current_active_user, get_current_user, require_role
from db import get_db
from models import Notification, User
from schemas import NotificationCreate, NotificationRead
from services import realtime

router = APIRouter(tags=["notifications"])


@router.get("/notifications/stream")
async def stream_notifications(
    request: Request,
    token: str = Query(None, description="Token JWT d'authentification (optionnel si cookie httpOnly présent)"),
    db: Session = Depends(get_db),
):
    try:
        user = get_current_user(request, token, db)
    except HTTPException:
        user = None

    origin = request.headers.get("origin") or "*"
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
    }

    if not user:
        async def empty_generator():
            yield ": unauthenticated\n\n"
        return StreamingResponse(
            empty_generator(),
            media_type="text/event-stream",
            headers=headers,
        )

    loop = asyncio.get_running_loop()
    queue = realtime.register(str(user.id), loop)

    async def event_generator():
        try:
            yield ": connecté\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15)
                    yield f"event: notification\ndata: {json.dumps(event, ensure_ascii=False)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        finally:
            realtime.unregister(str(user.id), loop, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers,
    )


@router.get("/notifications", response_model=List[NotificationRead])
async def list_notifications(
    utilisateur_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Notification)
    if current_user.role != "admin":
        stmt = stmt.where(Notification.utilisateur_id == current_user.id)
    if utilisateur_id and current_user.role == "admin":
        stmt = stmt.where(Notification.utilisateur_id == utilisateur_id)
    stmt = stmt.where(Notification.canal == "in_app")
    if statut:
        stmt = stmt.where(Notification.statut == statut)
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    notifications = db.execute(stmt).scalars().all()
    return notifications


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_create: NotificationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if not db.get(User, notification_create.utilisateur_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur introuvable")

    notification = Notification(**notification_create.dict(exclude_unset=True))
    db.add(notification)
    try:
        db.commit()
        db.refresh(notification)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de création de notification: {exc.orig}") from exc
    return notification


@router.get("/notifications/{notification_id}", response_model=NotificationRead)
async def read_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification non trouvée")
    if current_user.role != "admin" and notification.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    return notification


@router.put("/notifications/{notification_id}/lu", response_model=NotificationRead)
async def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification non trouvée")
    if current_user.role != "admin" and notification.utilisateur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    notification.statut = "lu"
    notification.date_lecture = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/notifications/lu-toutes", response_model=List[NotificationRead])
async def mark_all_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Notification).where(
        Notification.utilisateur_id == current_user.id,
        Notification.statut != "lu",
    )
    notifs = db.execute(stmt).scalars().all()
    now = datetime.now(timezone.utc)
    for n in notifs:
        n.statut = "lu"
        n.date_lecture = now
    db.commit()
    return notifs
