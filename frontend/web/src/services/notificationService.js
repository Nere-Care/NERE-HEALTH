const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 204 || response.status === 404) return null;

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof data.detail === "string"
        ? data.detail
        : `Erreur ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
    }
    throw err;
  }
}

export async function fetchNotifications() {
  return apiFetch(`${BASE_URL}/notifications`) ?? [];
}

export async function fetchNotification(id) {
  return apiFetch(`${BASE_URL}/notifications/${id}`);
}

export async function marquerLue(id) {
  return apiFetch(`${BASE_URL}/notifications/${id}/lire`, { method: "PATCH" });
}

export async function toutMarquerLue() {
  return apiFetch(`${BASE_URL}/notifications/tout-lire`, { method: "PATCH" });
}