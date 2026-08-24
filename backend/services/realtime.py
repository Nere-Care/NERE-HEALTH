import asyncio
import json
import logging
import threading
import time
from collections import defaultdict
from datetime import datetime, timezone

import psycopg2
from sqlalchemy import event
from sqlalchemy.orm import Session

from config import settings
from db import SessionLocal, engine
from models import Notification

logger = logging.getLogger("realtime")

NOTIFY_CHANNEL = "nere_notifications"

# user_id (str) -> set[(event_loop, asyncio.Queue)]
_connections: dict[str, set[tuple[asyncio.AbstractEventLoop, asyncio.Queue]]] = defaultdict(set)
_connections_lock = threading.Lock()


def register(user_id: str, loop: asyncio.AbstractEventLoop) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    with _connections_lock:
        _connections[user_id].add((loop, queue))
    return queue


def unregister(user_id: str, loop: asyncio.AbstractEventLoop, queue: asyncio.Queue) -> None:
    with _connections_lock:
        conns = _connections.get(user_id)
        if conns:
            conns.discard((loop, queue))
            if not conns:
                _connections.pop(user_id, None)


def broadcast_local(user_id: str | None, payload: dict) -> None:
    """Distribue un événement aux connexions SSE de ce worker."""
    if not user_id:
        return
    with _connections_lock:
        conns = list(_connections.get(user_id, ()))
    for loop, queue in conns:
        try:
            loop.call_soon_threadsafe(queue.put_nowait, payload)
        except RuntimeError:
            pass


def publish(user_id, payload: dict) -> None:
    """Publie un événement via PostgreSQL NOTIFY (diffusé à tous les workers)."""
    event = dict(payload)
    event["user_id"] = str(user_id)
    data = json.dumps(event, ensure_ascii=False, default=str)
    if len(data) > 7900:
        data = data[:7900]
    try:
        conn = engine.raw_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT pg_notify(%s, %s)", (NOTIFY_CHANNEL, data))
            conn.commit()
        finally:
            conn.close()
    except Exception:
        logger.exception("Échec de publication de l'événement temps réel")


def _listener_loop() -> None:
    """Écoute le canal PostgreSQL et distribue les événements aux connexions locales."""
    while True:
        conn = None
        try:
            conn = psycopg2.connect(settings.DATABASE_URL)
            conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
            with conn.cursor() as cur:
                cur.execute(f"LISTEN {NOTIFY_CHANNEL}")
            logger.info("Listener temps réel connecté sur %s", NOTIFY_CHANNEL)
            while True:
                conn.poll()
                for notify in conn.notifies:
                    try:
                        payload = json.loads(notify.payload)
                        broadcast_local(payload.get("user_id"), payload)
                    except Exception:
                        logger.exception("Erreur de traitement d'un événement temps réel")
                conn.notifies.clear()
                time.sleep(0.1)
        except Exception:
            logger.exception("Erreur du listener temps réel, reconnexion dans 3 s")
            time.sleep(3)
        finally:
            if conn is not None:
                try:
                    conn.close()
                except Exception:
                    pass


_listener_started = False
_listener_lock = threading.Lock()


def start_listener() -> None:
    global _listener_started
    with _listener_lock:
        if _listener_started:
            return
        _listener_started = True
        thread = threading.Thread(target=_listener_loop, name="sse-listener", daemon=True)
        thread.start()


def _notification_payload(n: Notification) -> dict:
    created = n.created_at or datetime.now(timezone.utc)
    return {
        "id": str(n.id),
        "type": getattr(n, "type", None),
        "canal": getattr(n, "canal", None),
        "statut": getattr(n, "statut", None),
        "titre": getattr(n, "titre", None),
        "contenu": getattr(n, "contenu", None),
        "reference_externe": str(n.reference_externe) if getattr(n, "reference_externe", None) else None,
        "created_at": created.isoformat(),
    }


@event.listens_for(Notification, "after_insert")
def _on_notification_insert(mapper, connection, target: Notification) -> None:
    session = Session.object_session(target)
    if session is None:
        return
    pending = session.info.setdefault("_pending_realtime_events", [])
    pending.append((target.utilisateur_id, _notification_payload(target)))


@event.listens_for(SessionLocal, "after_commit")
def _on_session_commit(session) -> None:
    pending = session.info.pop("_pending_realtime_events", [])
    for user_id, payload in pending:
        publish(user_id, payload)


@event.listens_for(SessionLocal, "after_rollback")
def _on_session_rollback(session) -> None:
    session.info.pop("_pending_realtime_events", None)
