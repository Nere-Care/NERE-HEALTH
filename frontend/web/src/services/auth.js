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

async function parseError(response) {
  const text = await response.text()
  try {
    const parsed = JSON.parse(text)
    const detail = parsed.detail
    if (typeof detail === 'string') return { message: detail, code: null }
    if (detail && typeof detail.message === 'string') return { message: detail.message, code: detail.code || null }
    return { message: text, code: null }
  } catch {
    return { message: text || 'Une erreur est survenue', code: null }
  }
}

async function throwApiError(response) {
  const { message, code } = await parseError(response)
  const error = new Error(message || 'Une erreur est survenue')
  error.code = code
  throw error
}

async function fetchAndStoreUser() {
  const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: 'include',
  })

  if (!meResponse.ok) {
    throw new Error('Impossible de récupérer les informations utilisateur')
  }

  const me = await meResponse.json()

  const browserTz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return null
    }
  })()

  const userTz = browserTz || me.timezone || "Africa/Douala"

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
    email_verifie: me.email_verifie,
    totp_actif: me.totp_actif,
  }

  localStorage.setItem('user', JSON.stringify(user))

  return user
}

export async function login(email, password) {
  const formData = new URLSearchParams()
  formData.append('username', email)
  formData.append('password', password)

  const response = await fetch(`${API_BASE_URL}/api/auth/token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  const data = await response.json()

  if (data.requires_2fa) {
    return { requires_2fa: true, totp_token: data.totp_token }
  }

  return fetchAndStoreUser()
}

export async function verifyTwoFactor(code, totpToken) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-2fa`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, totp_token: totpToken }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return fetchAndStoreUser()
}

export async function verifyEmail(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function verifyEmailCode(email, code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email-code`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function resendVerification(payload) {
  const { email, token } = payload || {}
  const body = email ? { email } : token ? { token } : {}
  const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(email ? { 'X-Resend-Email': encodeURIComponent(email) } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function twofaSetup() {
  const response = await fetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function twofaEnable(code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/2fa/enable`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function twofaDisable(code) {
  const response = await fetch(`${API_BASE_URL}/api/auth/2fa/disable`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function register(userData, role) {
  const endpoint = role === "medecin"
    ? `${API_BASE_URL}/api/auth/register/medecin`
    : `${API_BASE_URL}/api/auth/register/patient`

  const response = await fetch(endpoint, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    await throwApiError(response)
  }

  return response.json()
}

export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // Ignore error if network fails during logout
  }
  localStorage.removeItem('user')
}

export async function googleLogin(credential, role) {
  const body = role ? { credential, role } : { credential }
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    let detail = "Erreur lors de la connexion Google"
    detail = data.detail || detail
    throw new Error(typeof detail === "string" ? detail : detail?.message || detail)
  }

  if (data.needs_role) {
    return { needs_role: true, ...data }
  }

  if (data.requires_2fa) {
    return { requires_2fa: true, totp_token: data.totp_token }
  }

  return fetchAndStoreUser()
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de la demande de réinitialisation")
  }

  return data
}

export async function resetPassword(token, newPassword) {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de la réinitialisation")
  }

  return data
}

export function getToken() {
  return null
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const user = JSON.parse(raw)
    const browserTz = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        return null
      }
    })()
    if (browserTz && user && user.timezone !== browserTz) {
      user.timezone = browserTz
      localStorage.setItem('user', JSON.stringify(user))
    }
    return user
  } catch {
    return null
  }
}
