import logging
from abc import ABC, abstractmethod
from uuid import UUID

from sqlalchemy.orm import Session

from models import Notification

logger = logging.getLogger(__name__)


class NotificationChannel(ABC):
    @abstractmethod
    def send(self, utilisateur_id: UUID, titre: str, contenu: str, donnees: dict | None = None) -> bool:
        ...


class InAppNotificationChannel(NotificationChannel):
    def send(self, utilisateur_id: UUID, titre: str, contenu: str, donnees: dict | None = None) -> bool:
        logger.info("In-app notification pour %s: %s", utilisateur_id, titre)
        return True


class PushNotificationChannel(NotificationChannel):
    def send(self, utilisateur_id: UUID, titre: str, contenu: str, donnees: dict | None = None) -> bool:
        logger.info("Push notification (stub) pour %s: %s", utilisateur_id, titre)
        return True


class SMSNotificationChannel(NotificationChannel):
    def send(self, utilisateur_id: UUID, titre: str, contenu: str, donnees: dict | None = None) -> bool:
        logger.info("SMS notification (stub) pour %s: %s", utilisateur_id, titre)
        return True


class NotificationService:
    def __init__(self):
        self._channels: dict[str, NotificationChannel] = {
            "in_app": InAppNotificationChannel(),
            "push": PushNotificationChannel(),
            "sms": SMSNotificationChannel(),
        }

    def register_channel(self, canal: str, channel: NotificationChannel):
        self._channels[canal] = channel

    def send_notification(
        self,
        db: Session,
        utilisateur_id: UUID,
        type_notif: str,
        canal: str,
        titre: str,
        contenu: str,
        donnees: dict | None = None,
    ) -> Notification:
        notification = Notification(
            utilisateur_id=utilisateur_id,
            type=type_notif,
            canal=canal,
            titre=titre,
            contenu=contenu,
            donnees_supplementaires=donnees or {},
        )
        db.add(notification)
        db.flush()

        channel = self._channels.get(canal)
        if channel:
            success = channel.send(utilisateur_id, titre, contenu, donnees)
            if success:
                notification.statut = "envoye"
            else:
                notification.statut = "echoue"
                notification.derniere_erreur = "Échec d'envoi via le canal"
        else:
            notification.statut = "en_attente"

        db.commit()
        db.refresh(notification)
        return notification


notification_service = NotificationService()
