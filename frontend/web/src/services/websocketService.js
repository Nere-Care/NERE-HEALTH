let socket = null;
let listeners = [];
let isExplicitlyClosed = false;

export function connectWebSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  // Si une connexion est DEJA ouverte ou EN COURS de connexion, on ne refait rien
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return socket;
  }

  isExplicitlyClosed = false;
  const wsUrl = `ws://localhost:8100/ws/messages?token=${token}`;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("✅ WebSocket connecté avec succès");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      listeners.forEach((cb) => cb(data));
    } catch (e) {
      console.error("Erreur parsing WebSocket:", e);
    }
  };

  socket.onclose = (event) => {
    if (isExplicitlyClosed || event.code === 1008) return;

    console.log("⚠️ WebSocket fermé. Tentative de reconnexion dans 3s...");
    setTimeout(() => {
      if (!isExplicitlyClosed) connectWebSocket();
    }, 3000);
  };

  socket.onerror = (err) => {
    console.error("❌ Erreur WebSocket:", err);
  };

  return socket;
}

export function onWebSocketMessage(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

export function disconnectWebSocket() {
  isExplicitlyClosed = true;
  if (socket) {
    // Ne fermer que si la connexion est bien établie ou en train de s'ouvrir
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    socket = null;
  }
  listeners = [];
}