const BASE_URL = "http://localhost:8100/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function creerRendezVous(rdvData) {
  const response = await fetch(`${BASE_URL}/rendez_vous/patient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rdvData),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur création RDV");
  }
  return response.json();
}

export async function preautoriserPaiement(rdvId, methode, fournisseur, phoneNumber, cardNumber, cardHolder) {
  const response = await fetch(`${BASE_URL}/paiements/preautorisation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rdv_id: rdvId,
      methode: methode,        // "mobile_money" ou "carte" (pour validation logique)
      fournisseur: fournisseur, // ✅ "mtn_momo", "orange_money", "carte_visa"... (valeur ENUM)
      phone_number: phoneNumber,
      card_number: cardNumber,
      card_holder: cardHolder,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur paiement");
  }
  return response.json();
}

export async function fetchMesRendezVous() {
  const response = await fetch(`${BASE_URL}/mes-rendez-vous`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement RDV");
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
    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string" ? data.detail : `Erreur ${response.status}`
      );
    }
    return data;
  } catch (err) {
    if (err.message === "Failed to fetch")
      throw new Error("Serveur inaccessible");
    throw err;
  }
}


// Medecin : ses RDV
export async function fetchMedecinRendezVous(statut = null) {
  const params = statut ? `?statut=${statut}` : "";
  return apiFetch(`${BASE_URL}/medecin/mes-rendez-vous${params}`);
}

// Medecin : changer statut RDV
export async function changerStatutRdv(rdvId, statut) {
  return apiFetch(`${BASE_URL}/medecin/rendez_vous/${rdvId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
}

// Medecin : demandes d'avis recues
export async function fetchDemandesAvisRecues() {
  return apiFetch(`${BASE_URL}/avis/demandes/recues`);
}

// Medecin : repondre a une demande d'avis
export async function repondreDemandeAvis(demandeId, reponse) {
  return apiFetch(`${BASE_URL}/avis/demandes/${demandeId}/repondre`, {
    method: "POST",
    body: JSON.stringify(reponse),
  });
}


export async function fetchTeleconsultationsDuJour() {
  return apiFetch(`${BASE_URL}/medecin/teleconsultations-du-jour`);
}

export async function fetchTeleconsultationsHistorique() {
  return apiFetch(`${BASE_URL}/medecin/teleconsultations-historique`);
}

export async function demarrerTeleconsultation(rdvId) {
  return apiFetch(`${BASE_URL}/medecin/rendez_vous/${rdvId}/demarrer-teleconsultation`, {
    method: "POST",
  });
}

export async function terminerTeleconsultation(rdvId) {
  return apiFetch(`${BASE_URL}/medecin/rendez_vous/${rdvId}/terminer-teleconsultation`, {
    method: "PATCH",
  });
}
























