// 1. Déclarer BASE_URL en premier
const BASE_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:8100";
const API_PREFIX = "/api"; // ✅ AJOUT DU PRÉFIXE API

// 2. Déclarer ensuite les URL dérivées
const AUTH_URL = `${BASE_URL}/auth`; // auth_router n'a pas de préfixe dans main.py
const USERS_URL = `${BASE_URL}${API_PREFIX}/users`; // ✅ CORRECTION : ajout de /api

export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  console.log("➡️ LOGIN REQUEST:", { email, password });

  const response = await fetch(`${AUTH_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  const data = await response.json();

  console.log("⬅️ LOGIN STATUS:", response.status);
  console.log("⬅️ LOGIN RESPONSE:", data);

  if (!response.ok) {
    console.error("❌ LOGIN ERROR:", data);
    let errorMessage = "Login failed";
    if (data && data.detail) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        errorMessage = data.detail[0].msg;
      } else if (typeof data.detail === "object") {
        errorMessage = data.detail.message || JSON.stringify(data.detail);
      }
    }
    throw new Error(errorMessage);
  }
  console.log("✅ LOGIN SUCCESS:", data);
  return data;
}

export async function getCurrentUser(token) {
  console.log("➡️ GET CURRENT USER with token:", token);
  const response = await fetch(`${AUTH_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log("⬅️ USER STATUS:", response.status);
  console.log("⬅️ USER RESPONSE:", data);
  if (!response.ok) {
    console.error("❌ GET USER ERROR:", data);
    throw new Error(data.detail || "Unauthorized");
  }
  console.log("✅ USER LOADED:", data);
  return data;
}

export const register = async (formData) => {
  console.log("🚀 REGISTER API CALLED");
  console.log("🚀 DATA:", formData);
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
  console.log("🚀 STATUS:", res.status);
  const data = await res.json();
  console.log("🚀 RESPONSE:", data);
  if (!res.ok) {
    console.error("Détails erreurs:", JSON.stringify(data.detail, null, 2));
    throw new Error(data.detail || "Erreur inscription");
  }
  return data;
};

export async function loginWithGoogle(credential) {
  console.log("➡️ GOOGLE LOGIN REQUEST");
  const response = await fetch(`${AUTH_URL}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await response.json();
  console.log("⬅️ GOOGLE LOGIN STATUS:", response.status);
  console.log("⬅️ GOOGLE LOGIN RESPONSE:", data);
  if (!response.ok) {
    throw new Error(data.detail || "Erreur connexion Google");
  }
  return data;
}

export async function setup2FA(token) {
  const response = await fetch(`${AUTH_URL}/2fa/setup`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Erreur");
  return data;
}

export async function activer2FA(token, code) {
  const response = await fetch(`${AUTH_URL}/2fa/activer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code: String(code) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Code invalide");
  return data;
}

export async function verifier2FALogin(tempToken, code) {
  const response = await fetch(`${AUTH_URL}/2fa/verifier`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ temp_token: tempToken, code: String(code) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Code incorrect");
  return data;
}

export async function desactiver2FA(token, password) {
  const response = await fetch(`${AUTH_URL}/2fa/desactiver`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Erreur");
  return data;
}

// ✅ CORRECTION ICI : Utiliser USERS_URL au lieu de AUTH_URL2
export async function verifierMotDePasse(token, password) {
  const response = await fetch(`${USERS_URL}/confirm-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Mot de passe incorrect");
  }
  return data;
}