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

    if (response.status === 204) return null;
    if (response.status === 404) return null;

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

export async function fetchPatientProfil() {
  return apiFetch(`${BASE_URL}/patients/me/profil`);
}

export async function fetchDocumentsMedicaux() {
  return apiFetch(`${BASE_URL}/documents_medicaux?limit=50`);
}

export async function updatePatientProfil(data) {
  return apiFetch(`${BASE_URL}/patients/me/profil`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}