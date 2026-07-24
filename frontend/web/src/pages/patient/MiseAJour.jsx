import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader, Link } from 'lucide-react';
import { get } from '../../services/apiClient';

export default function MiseAJour({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        const data = await get(`/api/mises_a_jour/${id}`);
        setItem(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-500 mb-4">
          <ArrowLeft size={18} /> Retour
        </button>
        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Mise à jour introuvable.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-500 mb-6">
        <ArrowLeft size={18} /> Retour
      </button>

      <div className={`max-w-2xl mx-auto rounded-3xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-4xl">{item.icon || "🔔"}</div>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{item.titre}</h1>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {item.contenu}
        </p>

        {item.lien && (
          <div className={`mt-6 p-4 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <a
              href={item.lien}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-blue-500 hover:underline font-medium"
            >
              <Link size={18} /> Voir le lien
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
