export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  console.log("➡️ LOGIN REQUEST:", { email, password });

  const response = await fetch("http://localhost:8100/auth/token", {
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
    throw new Error(data.detail || "Login failed");
  }

  console.log("✅ LOGIN SUCCESS:", data);
  return data;
}

export async function getCurrentUser(token) {
  console.log("➡️ GET CURRENT USER with token:", token);

  const response = await fetch("http://localhost:8100/auth/me", {
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

// authService.js

export const register = async (formData) => {
  console.log("🚀 REGISTER API CALLED");
  console.log("🚀 DATA:", formData);

  const res = await fetch("http://localhost:8100/auth/register", {
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

  const response = await fetch("http://localhost:8100/auth/google", {
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