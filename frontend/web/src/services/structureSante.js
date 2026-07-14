// Dans services/structureSante.js
const BASE_URL = "http://localhost:8100/api";

function getToken() {
  return localStorage.getItem("token"); // ou le nom exact où tu stockes le token
}

export async function fetchStructures({ search = "", type = "", ville = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (type) params.append("type_structure", type);
  if (ville) params.append("ville", ville);

  const response = await fetch(`${BASE_URL}/annuaire/structures?${params}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`, // ⚠️ Doit renvoyer le JWT valide
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement structures");
  }

  return response.json();
}


export async function fetchStructureProfil(id) {
  const response = await fetch(`${BASE_URL}/structures/${id}/profil`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement profil");
  }

  return response.json();
}