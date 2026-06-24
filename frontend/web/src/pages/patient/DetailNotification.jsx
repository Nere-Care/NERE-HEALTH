import { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchNotification, marquerLue } from '../../services/notificationService';
import { getConfig, tempsRelatif } from '../../constants/notificationConfig';

export default function DetailNotification({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchNotification(id);
        if (!data) {
          setErreur("Notification introuvable");
          return;
        }
        setNotification(data);
        // Marquer comme lue si pas encore fait
        if (data.statut !== "lu") {
          await marquerLue(id).catch(() => {});
        }
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erreur || !notification) return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <ArrowLeft size={18} /> Retour
      </button>
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl
        ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
        <span className="text-sm">{erreur || "Notification introuvable"}</span>
      </div>
    </div>
  );

  const { icon: Icon, couleur } = getConfig(notification.type);

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>

      <button
        onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium transition-all
          ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-500"}`}
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      <div className={`rounded-3xl shadow-lg p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>

        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${couleur}`}>
            <Icon size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{notification.titre}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {notification.created_at
                ? new Date(notification.created_at).toLocaleString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                : ""}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Bell size={18} className="text-blue-500" />
            <p className="font-semibold">Détails de la notification</p>
          </div>
          <p className={`leading-relaxed text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {notification.contenu}
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <span className={`text-xs px-3 py-1 rounded-full
            ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-500"}`}>
            {tempsRelatif(notification.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}