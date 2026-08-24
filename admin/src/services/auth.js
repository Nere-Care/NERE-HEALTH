import { API_BASE_URL } from "./api";

const API_URL = `${API_BASE_URL}/api`;

async function parseError(response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const detail = parsed.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail.message === "string") return detail.message;
    return text;
  } catch {
    return text || "Une erreur est survenue";
  }
}

export async function loginAdmin(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();

  if (data.requires_2fa) {
    return { requires_2fa: true, totp_token: data.totp_token };
  }
  if (data.access_token) {
    localStorage.setItem("admin_token", data.access_token);
  }

  return fetchAndStoreAdmin(data.access_token);
}

export async function verifyAdminTwoFactor(code, totpToken) {
  const response = await fetch(`${API_URL}/auth/verify-2fa`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, totp_token: totpToken }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem("admin_token", data.access_token);
  }

  return fetchAndStoreAdmin(data.access_token);
}

async function fetchAndStoreAdmin(token = null) {
  const meResponse = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });

  if (!meResponse.ok) {
    throw new Error("Impossible de récupérer les informations");
  }

  const me = await meResponse.json();

  if (me.role !== "admin" && me.role !== "administrateur") {
    throw new Error("Accès réservé aux administrateurs");
  }

  const browserTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  })();

  const activeToken = token || localStorage.getItem("admin_token") || "";

  const adminObj = {
    email: me.email,
    prenom: me.prenom,
    nom: me.nom,
    id: me.id,
    role: me.role,
    timezone: browserTz || me.timezone || "Africa/Douala",
    token: activeToken,
  };

  localStorage.setItem("admin_user", JSON.stringify(adminObj));

  return me;
}

export async function logoutAdmin() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {}
  localStorage.removeItem("admin_user");
  window.location.href = "/login";
}

export function isAdminAuthenticated() {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith("nere_authed="));
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem("admin_user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    const browserTz = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return null;
      }
    })();
    if (browserTz && user && user.timezone !== browserTz) {
      user.timezone = browserTz;
      localStorage.setItem("admin_user", JSON.stringify(user));
    }
    return user;
  } catch {
    return null;
  }
}
