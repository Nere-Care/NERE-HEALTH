const BASE_URL = "http://localhost:8100/api";

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

    if (response.status === 404) return null;
    if (response.status === 204) return null;

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

export async function fetchConversations() {
  return apiFetch(`${BASE_URL}/mes-conversations`) ?? [];
}

export async function fetchMessages(convId) {
  return apiFetch(`${BASE_URL}/mes-conversations/${convId}/messages`) ?? [];
}

export async function envoyerMessage(convId, texte) {
  return apiFetch(`${BASE_URL}/mes-conversations/${convId}/messages`, {
    method: "POST",
    body: JSON.stringify({ texte }),
  });
}



export async function envoyerFichier(convId, file) {
  const formData = new FormData();
  formData.append("fichier", file);

  const response = await fetch(`${BASE_URL}/mes-conversations/${convId}/messages/fichier`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`);
  }
  return data;
}