import { API_BASE_URL } from './apiClient'

let es = null
let reconnectTimer = null
const listeners = new Set()

function connect() {
  const userStr = localStorage.getItem("user");
  if (!userStr || es || typeof EventSource === "undefined") return;

  let token = "";
  try {
    const user = JSON.parse(userStr);
    token = user.token || "";
  } catch {}

  const url = token
    ? `${API_BASE_URL}/api/notifications/stream?token=${token}`
    : `${API_BASE_URL}/api/notifications/stream`;

  es = new EventSource(url)

  es.addEventListener('notification', (ev) => {
    let data
    try {
      data = JSON.parse(ev.data)
    } catch {
      return
    }
    listeners.forEach((fn) => {
      try {
        fn(data)
      } catch {
        /* ignore */
      }
    })
  })

  es.onerror = () => {
    if (es) {
      es.close()
      es = null
    }
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = setTimeout(connect, 5000)
  }
}

export function connectNotifStream() {
  connect()
}

export function disconnectNotifStream() {
  if (es) {
    es.close()
    es = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

export function onNotification(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function notifyWindow(event) {
  window.dispatchEvent(new CustomEvent('nere:notification', { detail: event }))
}
