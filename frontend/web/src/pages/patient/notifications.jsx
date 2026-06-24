import { useState, useEffect } from 'react';
import { Bell, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  marquerLue,
  toutMarquerLue,
} from '../../services/notificationService';
import { getConfig, tempsRelatif } from '../../constants/notificationConfig';

export default function Notifications({ darkMode }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchNotifications();
        setNotifications(data ?? []);
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  const handleClick = async (notif) => {
    if (notif.statut !== "lu") {
      await marquerLue(notif.id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, statut: "lu" } : n)
      );
    }
    navigate(`/notification/${notif.id}`);
  };

  const handleToutLire = async () => {
    await toutMarquerLue().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, statut: "lu" })));
  };

  const nonLues = notifications.filter(n => n.statut !== "lu").length;
  const aujourdhui = notifications.filter(n => {
    if (!n.created_at) return false;
    const d = new Date(n.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Notifications</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Historique de vos notifications
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Non lues", value: nonLues, icon: Bell, bg: darkMode ? "bg-blue-900" : "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-500", textColor: "text-blue-600" },
          { label: "Total", value: notifications.length, icon: FileText, bg: darkMode ? "bg-green-900" : "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-500", textColor: "text-green-600" },
          { label: "Aujourd'hui", value: aujourdhui, icon: Clock, bg: darkMode ? "bg-purple-900" : "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-500", textColor: "text-purple-600" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-2xl p-4 flex items-center gap-3 ${stat.bg}`}>
              <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                <Icon size={20} className={stat.iconColor} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur */}
      {!loading && erreur && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl mb-4
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <span className="text-sm">{erreur}</span>
        </div>
      )}

      {/* Liste */}
      {!loading && !erreur && (
        <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b
            ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
            <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
              Toutes les notifications
            </h2>
            {nonLues > 0 && (
              <button
                onClick={handleToutLire}
                className="text-xs text-blue-500 hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={`text-center py-16 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Aucune notification.
            </div>
          ) : (
            notifications.map((notif, index) => {
              const { icon: Icon, couleur } = getConfig(notif.type);
              const nonLue = notif.statut !== "lu";

              return (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all
                    ${index !== notifications.length - 1
                      ? darkMode ? "border-b border-gray-700" : "border-b border-gray-100"
                      : ""}
                    ${nonLue
                      ? darkMode ? "bg-gray-700/40" : "bg-blue-50/40"
                      : ""}
                    ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${couleur}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1">
                    <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {notif.titre}
                    </p>
                    <p className={`text-xs mt-0.5 line-clamp-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {notif.contenu}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tempsRelatif(notif.created_at)}
                    </p>
                  </div>

                  {nonLue && (
                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}