const BASE_URL = "http://localhost:8100/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function fetchDashboardPatient() {
  const response = await fetch(`${BASE_URL}/dashboard/patient`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement dashboard");
  }

  return response.json();
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
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`);
    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") throw new Error("Serveur inaccessible");
    throw err;
  }
}

export async function fetchMedecinDashboard() {
  return apiFetch(`${BASE_URL}/medecin/dashboard`);
}