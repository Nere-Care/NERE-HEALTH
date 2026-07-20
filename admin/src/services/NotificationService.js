import { adminFetch } from "./AuthService";

const API_URL = "http://localhost:8100/api"; // ⚠️ Remplace par ton IP WSL2 si nécessaire

export async function fetchNotifications(filtre = "tous") {
  const params = new URLSearchParams();
  if (filtre !== "tous") params.append("statut", filtre); // "non_lus" ou "lus"
  
  return adminFetch(`${API_URL}/admin/notifications?${params}`) ?? { notifications: [], total: 0 };
}

export async function markAsRead(notificationId) {
  return adminFetch(`${API_URL}/admin/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllAsRead() {
  return adminFetch(`${API_URL}/admin/notifications/read-all`, {
    method: "PATCH",
  });
}

export async function deleteNotification(notificationId) {
  return adminFetch(`${API_URL}/admin/notifications/${notificationId}`, {
    method: "DELETE",
  });
}