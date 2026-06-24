const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

export async function fetchPrescriptions() {
  const response = await fetch(`${BASE_URL}/ordonnances/mes-prescriptions`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement prescriptions");
  }

  return response.json();
}

export async function fetchPrescriptionDetail(ligneId) {
  const response = await fetch(`${BASE_URL}/ordonnances/prescriptions/${ligneId}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement détail");
  }

  return response.json();
}