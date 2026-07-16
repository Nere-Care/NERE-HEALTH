import { adminFetch } from "./AuthService"; 

const API_URL = "http://localhost:8100/api";

export async function fetchAdminDoctors() {
  return adminFetch(`${API_URL}/admin/medecins`) ?? [];
}

export async function createAdminDoctor(payload) {
  return adminFetch(`${API_URL}/admin/medecins`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDoctorStatus(doctorId, statut) {
  return adminFetch(`${API_URL}/admin/medecins/${doctorId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }),
  });
}

export async function deleteAdminDoctor(doctorId) {
  return adminFetch(`${API_URL}/admin/medecins/${doctorId}`, {
    method: "DELETE",
  });
}

export async function fetchDoctorDocuments(doctorId) {
  return adminFetch(`${API_URL}/admin/medecins/${doctorId}/documents`) ?? [];
}

export async function fetchAdminDoctorStats() {
  return adminFetch(`${API_URL}/admin/stats/medecins`);
}