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




// ============================================
// MEDECIN — ses patients (via RDV)
// ============================================
export async function fetchMesPatients(search = "") {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await apiFetch(`${BASE_URL}/medecin/mes-patients${params}`);
  return data ?? [];
}

export async function fetchPatientConsultations(patientId) {
  const data = await apiFetch(`${BASE_URL}/medecin/patients/${patientId}/consultations`);
  return data ?? [];
}

export async function creerConsultation(consultationData) {
  return apiFetch(`${BASE_URL}/medecin/consultations`, {
    method: "POST",
    body: JSON.stringify(consultationData),
  });
}

// ============================================
// PATIENT — son propre profil
// ============================================
export async function fetchPatientProfil() {
  return apiFetch(`${BASE_URL}/patients/me/profil`);
}

export async function updatePatientProfil(payload) {
  return apiFetch(`${BASE_URL}/patients/me/profil`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchDocumentsMedicaux() {
  const data = await apiFetch(`${BASE_URL}/mes-documents-medicaux`);
  return data ?? [];
}

export async function fetchDashboardPatient() {
  return apiFetch(`${BASE_URL}/dashboard/patient`);
}

// ============================================
// ADMIN — liste globale patients (si besoin)
// ============================================
export async function fetchPatients({ search = "", gender = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (gender && gender !== "All") params.append("gender", gender);
  const data = await apiFetch(`${BASE_URL}/patients?${params}`);
  return data ?? [];
}

export async function fetchDossierMedical(patientId) {
  return apiFetch(`${BASE_URL}/dossiers-medicaux/patient/${patientId}`);
}






// ============================================
// UPLOAD DOCUMENT MÉDICAL
// ============================================
export async function uploadDocumentMedical(file, typeDocument = "resultat_labo", description = "") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type_document", typeDocument);
  if (description) {
    formData.append("description", description);
  }

  try {
    const response = await fetch(`${BASE_URL}/documents-medicaux/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // ❌ PAS de Content-Type ! Le navigateur le gère automatiquement pour FormData
      },
      body: formData,
    });

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



export async function updateDossierPatient(payload) {
  return apiFetch(`${BASE_URL}/patients/me/dossier`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
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

export async function supprimerDocument(documentId) {
  return apiFetch(`${BASE_URL}/mes-documents-medicaux/${documentId}`, {
    method: "DELETE",
  });
}








export async function fetchMesConsultationsPatient() {
  return apiFetch(`${BASE_URL}/patients/me/consultations`) ?? [];
}

export async function telechargerMonDossier() {
  const response = await fetch(`${BASE_URL}/patients/me/dossier/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("Erreur lors de la génération du PDF");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mon_dossier_medical.pdf";
  a.click();
  URL.revokeObjectURL(url);
}

export async function telechargerDossierPatient(patientId) {
  const response = await fetch(`${BASE_URL}/medecin/patients/${patientId}/dossier/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) throw new Error("Erreur lors de la génération du PDF");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dossier_patient.pdf";
  a.click();
  URL.revokeObjectURL(url);
}
