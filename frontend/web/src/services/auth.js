export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8100'

const ROLE_MAP = {
  medecin: 'doctor',
  patient: 'patient',
  administrateur: 'admin',
  admin: 'admin',
  structure: 'structure',
  observateur: 'observer',
  infirmier: 'nurse',
  nurse: 'nurse',
}

export function mapRole(backendRole) {
  return ROLE_MAP[backendRole] || backendRole || 'patient'
}

export async function login(email, password) {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Identifiants incorrects')
  }

  const data = await response.json()

  const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
    },
  })

  if (!meResponse.ok) {
    throw new Error('Impossible de récupérer les informations utilisateur')
  }

  const me = await meResponse.json()

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const userTz = me.timezone || browserTz

  const user = {
    email: me.email,
    role: mapRole(me.role),
    prenom: me.prenom,
    nom: me.nom,
    telephone: me.telephone,
    photo_url: me.photo_url,
    id: me.id,
    statut: me.statut,
    timezone: userTz,
    adresse: me.adresse,
    date_naissance: me.date_naissance,
    token: data.access_token,
  }

  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', data.access_token)

  if (userTz !== me.timezone) {
    fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timezone: userTz }),
    }).catch(() => {})
  }

  return user
}

export async function register(userData, role) {
  const endpoint = role === "medecin"
    ? `${API_BASE_URL}/api/auth/register/medecin`
    : `${API_BASE_URL}/api/auth/register/patient`

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const text = await response.text()
    let detail = "Erreur lors de l'inscription"
    try {
      const parsed = JSON.parse(text)
      detail = parsed.detail || detail
    } catch {}
    throw new Error(detail)
  }

  return await login(userData.email, userData.password)
}

export function logout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

export async function googleLogin(credential, role) {
  const body = role ? { credential, role } : { credential }
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    let detail = "Erreur lors de la connexion Google"
    detail = data.detail || detail
    throw new Error(detail)
  }

  if (data.needs_role) {
    return { needs_role: true, ...data }
  }

  const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${data.access_token}` },
  })

  if (!meResponse.ok) {
    throw new Error('Impossible de récupérer les informations utilisateur')
  }

  const me = await meResponse.json()
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const userTz = me.timezone || browserTz

  const user = {
    email: me.email,
    role: mapRole(me.role),
    prenom: me.prenom,
    nom: me.nom,
    telephone: me.telephone,
    photo_url: me.photo_url,
    id: me.id,
    statut: me.statut,
    timezone: userTz,
    adresse: me.adresse,
    date_naissance: me.date_naissance,
    token: data.access_token,
  }

  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('token', data.access_token)

  return user
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  } catch {
    return null
  }
}
