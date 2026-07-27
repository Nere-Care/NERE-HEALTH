// src/services/DashboardService.js
import { adminFetch } from "./AuthService";

// ⚠️ Remplace par ton IP WSL2 actuelle
const API_URL = "http://localhost:8100/api";

export async function fetchDashboardData() {
  try {
    // Idéalement, ton backend a une route unique qui renvoie tout ça
    const response = await adminFetch(`${API_URL}/admin/dashboard/stats`);
    return response;
  } catch (error) {
    console.error("Erreur chargement dashboard:", error);
    throw error;
  }
}