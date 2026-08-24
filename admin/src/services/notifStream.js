import { API_BASE_URL } from "./api";

let es = null;
let reconnectTimer = null;
const listeners = new Set();

function connect() {
  const userStr = localStorage.getItem("admin_user");
  if (!userStr || es || typeof EventSource === "undefined") return;

  let token = localStorage.getItem("admin_token") || "";
  if (!token) {
    try {
      const user = JSON.parse(userStr);
      token = user.token || "";
    } catch {}
  }

  const url = token
    ? `${API_BASE_URL}/api/notifications/stream?token=${token}`
    : `${API_BASE_URL}/api/notifications/stream`;

  try {
    es = new EventSource(url);
  } catch (err) {
    return;
  }

  es.addEventListener("notification", (ev) => {
    let data;
    try {
      data = JSON.parse(ev.data);
    } catch {
      return;
    }
    listeners.forEach((fn) => {
      try {
        fn(data);
      } catch {
        /* ignore */
      }
    });
  });

  es.onerror = () => {
    if (es) {
      es.close();
      es = null;
    }
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 15000);
  };
}

export function connectNotifStream() {
  connect();
}

export function disconnectNotifStream() {
  if (es) {
    es.close();
    es = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

export function onNotification(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
