import { get, post } from './apiClient'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8100'

export async function getCategories() {
  return get('/api/categories-tickets')
}

export async function uploadTicketFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE_URL}/api/tickets/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    let detail = "Erreur lors de l'envoi du fichier"
    try { detail = JSON.parse(text).detail || detail } catch {}
    throw new Error(detail)
  }
  return res.json()
}

export async function sendSupportTicket({ categorie_id, sujet, description, piece_jointe_url }) {
  return post('/api/tickets', { categorie_id, sujet, description, piece_jointe_url })
}

export async function getMyTickets(params = {}) {
  return get('/api/tickets', params)
}

export async function getTicket(ticketId) {
  return get(`/api/tickets/${ticketId}`)
}

export async function getTicketReponses(ticketId) {
  return get(`/api/tickets/${ticketId}/reponses`)
}

export async function addTicketReponse(ticketId, contenu, piece_jointe_url) {
  return post(`/api/tickets/${ticketId}/reponses`, { contenu, piece_jointe_url })
}
