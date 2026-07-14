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

    if (response.status === 204) return null;
    if (response.status === 404) return null;
    if (response.status === 401) {
      localStorage.clear();
      window.location.href = "/";
      return null;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`
      );
    }
    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
    }
    throw err;
  }
}

// ── PATIENTS ──────────────────────────────────────────────────────────────
export async function fetchAdminPatients({ nom = "", telephone = "", sexe = "", groupe = "", statut = "" } = {}) {
  const params = new URLSearchParams();
  if (nom) params.append("search", nom);
  if (telephone) params.append("telephone", telephone);
  if (sexe) params.append("sexe", sexe === "Masculin" ? "M" : sexe === "Féminin" ? "F" : "");
  if (groupe) params.append("groupe_sanguin", groupe);
  if (statut) params.append("statut", statut.toLowerCase());
  return apiFetch(`${BASE_URL}/admin/patients?${params}`) ?? [];
}

export async function fetchAdminPatient(patientId) {
  return apiFetch(`${BASE_URL}/admin/patients/${patientId}`);
}

export async function updateAdminPatient(patientId, payload) {
  return apiFetch(`${BASE_URL}/admin/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPatient(patientId) {
  return apiFetch(`${BASE_URL}/admin/patients/${patientId}`, {
    method: "DELETE",
  });
}

export async function fetchAdminPatientsStats() {
  return apiFetch(`${BASE_URL}/admin/stats/patients`);
}

export async function fetchAdminPatientsActivite() {
  return apiFetch(`${BASE_URL}/admin/patients/activite`);
}