export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchBackendStatus() {
  const response = await fetch(`${API_BASE_URL}/`)
  if (!response.ok) {
    throw new Error('Backend non disponible')
  }
  return response.json()
}
