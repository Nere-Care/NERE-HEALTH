export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8100'

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Request failed ${response.status}: ${text}`)
  }

  return response.json()
}

export async function fetchBackendStatus() {
  return fetchJson(`${API_BASE_URL}/`)
}

export async function fetchTables() {
  return fetchJson(`${API_BASE_URL}/api/tables`)
}

export async function fetchTableRows(tableName, limit = 10) {
  return fetchJson(`${API_BASE_URL}/api/tables/${tableName}?limit=${limit}`)
}

export async function fetchTableCount(tableName) {
  return fetchJson(`${API_BASE_URL}/api/tables/${tableName}/count`)
}

export async function createTableRow(tableName, payload) {
  return fetchJson(`${API_BASE_URL}/api/tables/${tableName}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

