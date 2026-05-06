from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..models import Notification, User
from ..schemas import NotificationCreate, NotificationRead

router = APIRouter(tags=["notifications"])


class NotificationConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)


manager = NotificationConnectionManager()


@router.websocket("/ws/notifications")
async def websocket_notifications(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


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
    if statut:
        stmt = stmt.where(Notification.statut == statut)
    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit)
    notifications = db.execute(stmt).scalars().all()
    return notifications


@router.post("/notifications", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_create: NotificationCreate,
    background_tasks: BackgroundTasks,
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de création de notification: {exc.orig}"
        ) from exc

    background_tasks.add_task(
        manager.broadcast,
        {
            "event": "notification_created",
            "notification_id": str(notification.id),
            "utilisateur_id": str(notification.utilisateur_id),
            "titre": notification.titre,
            "contenu": notification.contenu,
            "statut": notification.statut,
        },
    )
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
