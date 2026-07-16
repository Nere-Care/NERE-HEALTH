const BASE_URL = "http://localhost:8100";
const API_URL  = "http://localhost:8100/api";

// ── Clés localStorage ────────────────────────────────────────────────────
const TOKEN_KEY = "admin_token";
const USER_KEY  = "admin_user";

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  const token = getAdminToken();
  const user  = getAdminUser();
  return !!(token && user && user.role === "admin");
}

export function logoutAdmin() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Login ────────────────────────────────────────────────────────────────
export async function loginAdmin(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Identifiants incorrects."
    );
  }

  const token = data.access_token;

  // Vérifier que c'est bien un admin
  const meResponse = await fetch(`${API_URL}/admin/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const meData = await meResponse.json().catch(() => ({}));

  if (!meResponse.ok) {
    throw new Error("Accès refusé. Ce compte n'a pas les droits administrateur.");
  }

  if (meData.role !== "admin") {
    throw new Error("Ce compte n'est pas un compte administrateur.");
  }

  // Sauvegarder sous des clés séparées du frontend patient/médecin
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(meData));

  return { token, user: meData };
}

// ── apiFetch admin authentifié ────────────────────────────────────────────
export async function adminFetch(url, options = {}) {
  const token = getAdminToken();

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 204) return null;
    if (response.status === 401) {
      logoutAdmin();
      window.location.href = "/admin/login";
      return null;
    }
    if (response.status === 403) {
      throw new Error("Accès refusé. Droits administrateur requis.");
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
      throw new Error("Serveur inaccessible. Vérifiez votre connexion.");
    }
    throw err;
  }
}