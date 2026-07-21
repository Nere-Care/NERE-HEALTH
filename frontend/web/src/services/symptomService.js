const BASE_URL = "http://localhost:8100/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function analyserSymptomes(symptomes) {
  const response = await fetch(`${BASE_URL}/symptomes/analyser`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symptomes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de l'analyse");
  }
  return data;
}