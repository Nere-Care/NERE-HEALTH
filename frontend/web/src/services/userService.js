const BASE_URL = "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

export async function fetchProfilComplet() {
  const response = await fetch(`${BASE_URL}/users/me/profil-complet`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur chargement profil");
  }

  return response.json();
}

export async function changePassword(oldPassword, newPassword) {
  const response = await fetch(`${BASE_URL}/users/me/password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail || "Erreur changement mot de passe");
  }

  return response.json();
}