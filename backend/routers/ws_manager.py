from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> liste de connexions actives (plusieurs onglets possibles)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket, accept_first: bool = True):
        """
        Connecte le socket. Si accept_first est True, effectue le websocket.accept().
        """
        if accept_first:
            await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        if websocket not in self.active_connections[user_id]:
            self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_to_user(self, user_id: str, message: dict):
        """Envoie un message à toutes les connexions actives de cet utilisateur."""
        if user_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            
            # Nettoyer les connexions mortes
            for dead in dead_connections:
                self.active_connections[user_id].remove(dead)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    def is_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


manager = ConnectionManager()