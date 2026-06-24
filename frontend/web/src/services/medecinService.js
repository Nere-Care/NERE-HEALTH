const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

export async function fetchAnnuaire({ search = "", specialite = "Toutes" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (specialite && specialite !== "Toutes") params.append("specialite", specialite);

  const response = await fetch(`${BASE_URL}/annuaire/medecins?${params}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement annuaire");
  }

  return response.json();
}

export async function fetchProfilMedecin(medecinId) {
  const response = await fetch(`${BASE_URL}/annuaire/medecins/${medecinId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Médecin introuvable");
  }

  return response.json();
}