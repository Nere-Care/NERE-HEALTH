import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, FileText, Clock, Loader } from 'lucide-react';
import { get, put } from '../../services/apiClient';
import { getUserTimezone } from '../../utils/timezone';

const ICON_MAP = {
  rdv: 'bg-blue-100 text-blue-500',
  examen: 'bg-green-100 text-green-500',
  paiement: 'bg-purple-100 text-purple-500',
  message: 'bg-orange-100 text-orange-500',
  ordonnance: 'bg-red-100 text-red-500',
};

export default function Notifications({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get('/api/notifications', { limit: 50 })
      .then(data => setNotifications(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const marquerToutLu = async () => {
    try {
      await put('/api/notifications/lu-toutes');
      setNotifications(prev => prev.map(n => ({ ...n, statut: 'lu' })));
      afficherToast("Toutes marquées comme lues");
    } catch {}
  };

  const nonLues = notifications.filter(n => n.statut !== 'lu').length;
  const aujourdHui = notifications.filter(n => {
    if (!n.created_at) return false;
    return new Date(n.created_at).toDateString() === new Date().toDateString();
  }).length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Notifications</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Historique de vos notifications</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-blue-900" : "bg-blue-50"}`}>
          <div className="bg-blue-100 p-3 rounded-xl"><Bell size={20} className="text-blue-500" /></div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{nonLues}</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Non lues</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-green-900" : "bg-green-50"}`}>
          <div className="bg-green-100 p-3 rounded-xl"><FileText size={20} className="text-green-500" /></div>
          <div>
            <p className="text-2xl font-bold text-green-600">{notifications.length}</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total</p>
          </div>
        </div>
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-purple-900" : "bg-purple-50"}`}>
          <div className="bg-purple-100 p-3 rounded-xl"><Clock size={20} className="text-purple-500" /></div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{aujourdHui}</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aujourd'hui</p>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Toutes les notifications</h2>
          <button onClick={marquerToutLu} className="text-xs text-blue-500 hover:underline">Tout marquer comme lu</button>
        </div>

        {notifications.length === 0 ? (
          <div className={`text-center py-10 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune notification</div>
        ) : (
          notifications.map((notif, index) => {
            const estNonLu = notif.statut !== 'lu';
            const couleur = ICON_MAP[notif.type] || ICON_MAP.message;
            return (
              <div key={notif.id} onClick={() => navigate(`/notification/${notif.id}`)}
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all
                  ${index !== notifications.length - 1 ? (darkMode ? "border-b border-gray-700" : "border-b border-gray-100") : ''}
                  ${estNonLu ? (darkMode ? "bg-gray-700/40" : "bg-blue-50/40") : ''}
                  ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${couleur}`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${estNonLu ? (darkMode ? "text-white font-semibold" : "text-gray-800 font-semibold") : (darkMode ? "text-gray-400" : "text-gray-600")}`}>
                    {notif.titre || notif.message || notif.type || 'Notification'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {(notif.contenu || '').replace(/\n/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {notif.created_at ? new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: getUserTimezone() }) : ''}
                  </p>
                </div>
                {estNonLu && <div className="w-2 h-2 rounded-full bg-red-500" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
