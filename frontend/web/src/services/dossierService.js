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
      const message = typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`;
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

// ============================================
// LISTE DES PATIENTS
// ============================================
export async function fetchPatients({ search = "", gender = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (gender && gender !== "All") params.append("gender", gender);

  const data = await apiFetch(`${BASE_URL}/patients?${params}`);
  return data ?? [];
}

// ============================================
// DÉTAIL D'UN PATIENT
// ============================================
export async function fetchPatient(patientId) {
  return apiFetch(`${BASE_URL}/patients/${patientId}`);
}

// ============================================
// CONSULTATIONS D'UN PATIENT
// ============================================
export async function fetchConsultationsPatient(patientId) {
  const data = await apiFetch(`${BASE_URL}/consultations?patient_id=${patientId}`);
  return data ?? [];
}

// ============================================
// CRÉER UNE CONSULTATION
// ============================================
export async function creerConsultation(consultationData) {
  return apiFetch(`${BASE_URL}/consultations`, {
    method: "POST",
    body: JSON.stringify(consultationData),
  });
}

// ============================================
// DOSSIER MÉDICAL COMPLET
// ============================================
export async function fetchDossierMedical(patientId) {
  return apiFetch(`${BASE_URL}/dossiers-medicaux/patient/${patientId}`);
}



export async function uploaderDocument(fichier, typeDocument, description = "") {
  const formData = new FormData();
  formData.append("file", fichier);
  formData.append("type_document", typeDocument);
  if (description) formData.append("description", description);

  const BASE_URL = "http://localhost:8100/api"; // ⚠️ Pense à mettre ton IP WSL2 ici si le port forwarding n'est pas actif

  const response = await fetch(`${BASE_URL}/mes-documents-medicaux`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      // ⚠️ NE PAS ajouter "Content-Type": "multipart/form-data" ici, le navigateur le gère avec la boundary
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // ✅ NOUVEAU : Afficher l'erreur brute de FastAPI dans la console
    console.error("🔴 DÉTAIL EXACT DE L'ERREUR 422 BACKEND :", data.detail);
    
    let message = `Erreur ${response.status}`;
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      // Formate l'erreur pour qu'elle soit lisible (ex: "body > file: field required")
      message = data.detail.map((e) => `${e.loc?.join(" > ")}: ${e.msg}`).join(" | ");
    }
    throw new Error(message);
  }

  return data;
}