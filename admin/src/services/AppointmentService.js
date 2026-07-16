import { adminFetch } from "./AuthService";

// ⚠️ Remplace localhost par ton IP WSL2 si nécessaire (ex: http://172.27.150.253:8100/api)
const API_URL = "http://localhost:8100/api"; 

export async function fetchAppointments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status && filters.status !== "all") params.append("statut", filters.status);
  if (filters.mode && filters.mode !== "all") params.append("type", filters.mode === "En ligne" ? "video" : "presentiel");
  
  return adminFetch(`${API_URL}/admin/rendez-vous?${params}`) ?? { rendez_vous: [], total: 0 };
}

export async function createAppointment(payload) {
  return adminFetch(`${API_URL}/admin/rendez-vous`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAppointmentStatus(id, statut) {
  return adminFetch(`${API_URL}/admin/rendez-vous/${id}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }), // ex: "confirme" ou "annule"
  });
}

export async function deleteAppointment(id) {
  return adminFetch(`${API_URL}/admin/rendez-vous/${id}`, {
    method: "DELETE",
  });
}