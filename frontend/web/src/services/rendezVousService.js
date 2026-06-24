const BASE_URL = "http://localhost:8000";

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