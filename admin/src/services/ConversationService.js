import { adminFetch } from "./AuthService";

// ⚠️ Remplace par ton IP WSL2 si nécessaire (ex: http://172.27.150.253:8100/api)
const API_URL = "http://localhost:8100/api"; 

export async function fetchConversations(filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status && filters.status !== "Tous") params.append("statut", filters.status);
  if (filters.risk && filters.risk !== "Tous") params.append("risque", filters.risk);
  
  return adminFetch(`${API_URL}/admin/conversations?${params}`) ?? { conversations: [], total: 0 };
}

export async function fetchConversationDetails(id) {
  return adminFetch(`${API_URL}/admin/conversations/${id}`);
}

export async function sendAdminMessage(conversationId, text) {
  return adminFetch(`${API_URL}/admin/conversations/${conversationId}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function updateConversationStatus(conversationId, statut) {
  return adminFetch(`${API_URL}/admin/conversations/${conversationId}/statut`, {
    method: "PATCH",
    body: JSON.stringify({ statut }), // "Signalé" ou "Résolu"
  });
}

export async function banUser(userId, userType, reason) {
  return adminFetch(`${API_URL}/admin/users/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify({ user_type: userType, reason }),
  });
}