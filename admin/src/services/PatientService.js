import { adminFetch } from "./AuthService";

const API_URL = "http://localhost:8100/api";

export async function fetchAdminPatients({ nom = "", telephone = "", sexe = "", groupe = "", statut = "" } = {}) {
  const params = new URLSearchParams();
  if (nom)       params.append("search",        nom);
  if (telephone) params.append("telephone",     telephone);
  if (sexe)      params.append("sexe",          sexe === "Masculin" ? "M" : sexe === "Féminin" ? "F" : "");
  if (groupe)    params.append("groupe_sanguin", groupe);
  if (statut)    params.append("statut",        statut.toLowerCase());
  const data = await adminFetch(`${API_URL}/admin/patients?${params}`);
  return data ?? { patients: [], total: 0 };
}

export async function fetchAdminPatientsStats() {
  return adminFetch(`${API_URL}/admin/stats/patients`);
}

export async function fetchAdminPatientsActivite() {
  return adminFetch(`${API_URL}/admin/patients/activite`) ?? [];
}

export async function fetchAdminPatient(patientId) {
  return adminFetch(`${API_URL}/admin/patients/${patientId}`);
}

export async function updateAdminPatient(patientId, payload) {
  return adminFetch(`${API_URL}/admin/patients/${patientId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPatient(patientId) {
  return adminFetch(`${API_URL}/admin/patients/${patientId}`, {
    method: "DELETE",
  });
}