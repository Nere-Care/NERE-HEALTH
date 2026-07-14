

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
      throw new Error("Serveur inaccessible. Verifiez votre connexion.");
    }
    throw err;
  }
}

// ── PATIENT ──────────────────────────────────────────────────────────────
export async function fetchMesFactures(statut = "") {
  const params = new URLSearchParams();
  if (statut && statut !== "Tous") params.append("statut", statut);
  return apiFetch(`${BASE_URL}/mes-factures?${params}`) ?? [];
}

// ── MEDECIN — stats ───────────────────────────────────────────────────────
export async function fetchStatsPaiements() {
  const data = await apiFetch(`${BASE_URL}/medecin/stats-paiements`);
  if (!data) return [];
  return [
    {
      title: "Settlements",
      amount: `${Math.round(data.total_gagne).toLocaleString()} XAF`,
      trend: data.nb_paiements_mois > 0 ? 15 : 0,
    },
    {
      title: "Ready To Withdraw",
      amount: `${Math.round(data.disponible).toLocaleString()} XAF`,
      trend: 0,
    },
    {
      title: "Withdrawn Amount",
      amount: `${Math.round(data.total_retire).toLocaleString()} XAF`,
      trend: 0,
    },
  ];
}

// ── MEDECIN — paiements ───────────────────────────────────────────────────
export async function fetchMesPaiements(statut = null) {
  const params = statut ? `?statut=${statut}` : "";
  return apiFetch(`${BASE_URL}/medecin/mes-paiements${params}`) ?? [];
}

export async function fetchHistoriquePaiements() {
  return apiFetch(`${BASE_URL}/medecin/historique-paiements`) ?? [];
}

// ── MEDECIN — methodes ────────────────────────────────────────────────────
export async function fetchMethodesPaiement() {
  return apiFetch(`${BASE_URL}/medecin/methodes-paiement`) ?? [];
}

export async function saveMethodesPaiement(methodes) {
  return apiFetch(`${BASE_URL}/medecin/methodes-paiement`, {
    method: "POST",
    body: JSON.stringify({ methodes }),
  });
}

// ── MEDECIN — retrait ─────────────────────────────────────────────────────
export async function demanderRetrait(montant, methodeType) {
  return apiFetch(`${BASE_URL}/medecin/retrait`, {
    method: "POST",
    body: JSON.stringify({ montant, methode_type: methodeType }),
  });
}

