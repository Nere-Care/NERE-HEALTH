from typing import Dict, List, Tuple
from fastapi import WebSocket


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, List[Tuple[str, WebSocket]]] = {}

    async def join_room(self, room_id: str, user_id: str, websocket: WebSocket):
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        self.rooms[room_id].append((user_id, websocket))

    def leave_room(self, room_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            self.rooms[room_id] = [
                (uid, ws) for uid, ws in self.rooms[room_id] if ws != websocket
            ]
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    async def relay_to_others(self, room_id: str, sender_ws: WebSocket, message: dict):
        if room_id not in self.rooms:
            print(f"⚠️ Salle {room_id} introuvable pour le relais")
            return
        nb_destinataires = len([ws for uid, ws in self.rooms[room_id] if ws != sender_ws])
        print(f"➡️ Relais vers {nb_destinataires} destinataire(s) dans la salle {room_id}")
        for uid, ws in self.rooms[room_id]:
            if ws != sender_ws:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    print(f"❌ Echec envoi a {uid}: {e}")


room_manager = RoomManager()