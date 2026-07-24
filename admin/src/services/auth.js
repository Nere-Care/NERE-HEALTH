import { API_BASE_URL } from "./api";

export async function loginAdmin(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = "Identifiants incorrects";
    try {
      const parsed = JSON.parse(text);
      detail = parsed.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  const data = await response.json();

  const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  if (!meResponse.ok) {
    throw new Error("Impossible de récupérer les informations");
  }

  const me = await meResponse.json();

  if (me.role !== "admin" && me.role !== "administrateur") {
    throw new Error("Accès réservé aux administrateurs");
  }

  localStorage.setItem("admin_token", data.access_token);
  localStorage.setItem(
    "admin_user",
    JSON.stringify({
      email: me.email,
      prenom: me.prenom,
      nom: me.nom,
      id: me.id,
      role: me.role,
    })
  );

  return me;
}

export function logoutAdmin() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
  window.location.href = "/login";
}

export function getAdminToken() {
  return localStorage.getItem("admin_token");
}

export function getAdminUser() {
  try {
    const user = localStorage.getItem("admin_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}
