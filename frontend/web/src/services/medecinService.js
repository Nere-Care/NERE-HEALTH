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
      let message = `Erreur ${response.status}`;
      
      // ✅ NOUVEAU : Lire les erreurs de validation détaillées de FastAPI
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map(d => `${d.loc.join(' > ')}: ${d.msg}`).join('; ');
      }
      
      throw new Error(message);
    }
    return data;
  } catch (err) {
    if (err.message === "Failed to fetch") {
      throw new Error("Serveur inaccessible. Vérifiez que l'IP est correcte (172.27.150.253).");
    }
    throw err;
  }
}

// ============================================
// ANNUAIRE DES MÉDECINS
// ============================================
export async function fetchAnnuaire({ search = "", specialite = "Toutes" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (specialite && specialite !== "Toutes") params.append("specialite", specialite);

  return apiFetch(`${BASE_URL}/annuaire/medecins?${params}`);
}

export async function fetchProfilMedecin(medecinId) {
  return apiFetch(`${BASE_URL}/annuaire/medecins/${medecinId}`);
}

// ============================================
// DEMANDES D'AVIS MÉDICAL
// ============================================
export async function sendOpinionRequest(data) {
  return apiFetch(`${BASE_URL}/avis/demandes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchMesDemandesAvis() {
  return apiFetch(`${BASE_URL}/avis/demandes/mes-demandes`);
}

export async function fetchDemandesAvisRecues() {
  return apiFetch(`${BASE_URL}/avis/demandes/recues`);
}

export async function repondreDemandeAvis(demandeId, reponse) {
  return apiFetch(`${BASE_URL}/avis/demandes/${demandeId}/repondre`, {
    method: "POST",
    body: JSON.stringify(reponse),
  });
}

// ============================================
// PROFIL ET DISPONIBILITÉS MÉDECIN
// ============================================
export async function fetchMonProfil() {
  return apiFetch(`${BASE_URL}/medecin/mon-profil`);
}

export async function updateMonProfil(payload) {
  return apiFetch(`${BASE_URL}/medecin/mon-profil`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchMesDisponibilites() {
  return apiFetch(`${BASE_URL}/medecin/disponibilites`);
}

export async function updateMesDisponibilites(disponibilites) {
  return apiFetch(`${BASE_URL}/medecin/disponibilites`, {
    method: "PUT",
    // On enveloppe le tableau dans un objet {...}
    body: JSON.stringify({ disponibilites }), 
  });
}

export async function supprimerDisponibilite(dispoId) {
  return apiFetch(`${BASE_URL}/medecin/disponibilites/${dispoId}`, {
    method: "DELETE",
  });
}


export async function uploadMedecinPhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${BASE_URL}/medecin/mon-profil/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` }, // pas de Content-Type — le navigateur gere le boundary multipart
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`);
  }
  return data;
}

export async function supprimerMedecinPhoto() {
  return apiFetch(`${BASE_URL}/medecin/mon-profil/photo`, { method: "DELETE" });
}