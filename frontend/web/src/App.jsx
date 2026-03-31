import { useEffect, useState } from 'react'
import { API_BASE_URL, fetchBackendStatus } from './services/api'

export default function App() {
  const [backendStatus, setBackendStatus] = useState('en attente')

  useEffect(() => {
    fetchBackendStatus()
      .then((data) => setBackendStatus(data?.message || 'réponse reçue'))
      .catch(() => setBackendStatus('indisponible'))
  }, [])

  return (
    <div style={{ fontFamily: 'Arial', padding: 20 }}>
      <h1>Nere App — React (Vite)</h1>
      <p>Frontend prêt.</p>
      <div style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
        <p><strong>API backend :</strong> {API_BASE_URL}</p>
        <p><strong>Statut backend :</strong> {backendStatus}</p>
      </div>
      <p style={{ marginTop: 20 }}>
        Remplacez <code>VITE_API_URL</code> dans <code>frontend/web/.env</code> ou <code>frontend/web/.env.example</code> pour connecter le frontend.
      </p>
    </div>
  )
}
