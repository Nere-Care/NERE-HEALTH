import { adminFetch } from "./AuthService";

const API_URL = "http://localhost:8100/api";

export async function fetchAdminPaiements({ search = "", statut = "", methode = "", dateDebut = "", dateFin = "" } = {}) {
  const params = new URLSearchParams();
  if (search)    params.append("search", search);
  if (statut)    params.append("statut", statut);
  if (methode)   params.append("methode", methode);
  if (dateDebut) params.append("date_debut", dateDebut);
  if (dateFin)   params.append("date_fin", dateFin);

  const data = await adminFetch(`${API_URL}/admin/paiements?${params}`);
  return data ?? { paiements: [], total: 0 };
}

export async function fetchAdminPaiementsStats() {
  return adminFetch(`${API_URL}/admin/stats/paiements`);
}

export async function fetchAdminPaiement(paiementId) {
  return adminFetch(`${API_URL}/admin/paiements/${paiementId}`);
}

export async function updatePaiementStatut(paiementId, statut, motifRemboursement = null) {
  return adminFetch(`${API_URL}/admin/paiements/${paiementId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut, motif_remboursement: motifRemboursement }),
  });
}