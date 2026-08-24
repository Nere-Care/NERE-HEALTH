const defaultBaseUrl = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8100`
  : 'http://localhost:8100';

const API_BASE_URL = import.meta.env.VITE_API_URL || defaultBaseUrl;

export { API_BASE_URL }

async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const text = await response.text()
    let detail
    try {
      const parsed = JSON.parse(text)
      detail = Array.isArray(parsed.detail)
        ? parsed.detail.map((d) => d.msg || d.message || JSON.stringify(d)).join("; ")
        : parsed.detail || text
    } catch {
      detail = text
    }
    throw new Error(detail || `Erreur ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export function get(url, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString()
  const fullUrl = query ? `${url}?${query}` : url
  return request(fullUrl)
}

export function post(url, data, options = {}) {
  const isFormData = data instanceof FormData;
  return request(url, {
    method: 'POST',
    body: isFormData ? data : JSON.stringify(data),
    ...options,
  })
}

export function put(url, data) {
  return request(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function del(url) {
  return request(url, {
    method: 'DELETE',
  })
}
