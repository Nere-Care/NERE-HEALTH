const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}


// Pattern réutilisable à mettre en haut de chaque service
async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
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

export async function fetchMesFactures(statut = "") {
  const params = new URLSearchParams();
  if (statut && statut !== "Tous") params.append("statut", statut);

  const response = await fetch(`${BASE_URL}/mes-factures?${params}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement factures");
  }

  return response.json();
}