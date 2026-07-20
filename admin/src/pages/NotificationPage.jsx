import { useState, useMemo, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Bell,
  Check,
  Trash2,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Filter,
  RefreshCw,
  Calendar,
} from "lucide-react";

import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../services/NotificationService";

export default function NotificationsPage({ darkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("tous"); // "tous", "non_lus", "lus"

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchNotifications(filter);
      const rawList = Array.isArray(response) ? response : (response?.notifications || response?.data || []);
      
      const mapped = rawList.map(n => ({
        id: n.id,
        titre: n.titre,
        message: n.message,
        type: n.type || "info", // "info", "success", "warning", "error"
        lu: n.lu || false,
        created_at: n.created_at,
        action_url: n.action_url || null,
      }));
      
      setNotifications(mapped);
    } catch (err) {
      toast.error("❌ Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const stats = useMemo(() => ({
    total: notifications.length,
    non_lus: notifications.filter(n => !n.lu).length,
  }), [notifications]);

  const handleMarkAsRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
      toast.success("✅ Notification marquée comme lue");
    } catch (err) {
      toast.error("❌ Erreur lors de la mise à jour");
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      toast.success("✅ Toutes les notifications ont été marquées comme lues");
    } catch (err) {
      toast.error("❌ Erreur lors de la mise à jour");
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Supprimer cette notification ?")) return;
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("🗑️ Notification supprimée");
    } catch (err) {
      toast.error("❌ Erreur lors de la suppression");
    }
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle className="text-green-500" size={20} />;
      case "warning": return <AlertTriangle className="text-yellow-500" size={20} />;
      case "error": return <AlertTriangle className="text-red-500" size={20} />;
      case "medecin": return <UserPlus className="text-blue-500" size={20} />;
      case "message": return <MessageSquare className="text-purple-500" size={20} />;
      default: return <Bell className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("fr-FR", { 
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
    });
  };

  const bg = darkMode ? "bg-slate-950 text-white" : "bg-gray-100 text-gray-900";
  const card = darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200";

  return (
    <div className={`min-h-screen p-4 md:p-6 space-y-6 ${bg}`}>
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bell className="text-blue-500" size={28} />
            Centre de Notifications
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {stats.non_lus > 0 ? `${stats.non_lus} notification(s) non lue(s)` : "Aucune nouvelle notification"}
          </p>
        </div>

        {stats.non_lus > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <Check size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {/* FILTERS */}
      <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 ${card}`}>
        {["tous", "non_lus", "lus"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              filter === f
                ? "bg-blue-600 text-white"
                : darkMode
                ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "tous" && "Toutes"}
            {f === "non_lus" && `Non lues (${stats.non_lus})`}
            {f === "lus" && "Lues"}
          </button>
        ))}
        <button 
          onClick={loadNotifications}
          className={`ml-auto p-2 rounded-xl transition ${darkMode ? "hover:bg-slate-800" : "hover:bg-gray-200"}`}
          title="Actualiser"
        >
          <RefreshCw size={18} className={darkMode ? "text-gray-400" : "text-gray-600"} />
        </button>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center ${card}`}>
          <Bell size={48} className={`mx-auto mb-4 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
          <p className="text-lg font-medium">Aucune notification</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Vous êtes à jour !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 ${
                notif.lu
                  ? darkMode
                    ? "bg-slate-900/50 border-slate-800 opacity-70"
                    : "bg-gray-50 border-gray-200 opacity-70"
                  : darkMode
                  ? "bg-slate-900 border-blue-500/30 shadow-lg shadow-blue-500/5"
                  : "bg-white border-blue-200 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`p-3 rounded-xl flex-shrink-0 ${
                  darkMode ? "bg-slate-800" : "bg-gray-100"
                }`}>
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${notif.lu ? "" : "text-blue-500"}`}>
                      {notif.titre}
                    </h3>
                    <span className={`text-xs flex items-center gap-1 flex-shrink-0 ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}>
                      <Calendar size={12} /> {formatDate(notif.created_at)}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-3 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {notif.message}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!notif.lu && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition flex items-center gap-1.5"
                      >
                        <Check size={12} /> Marquer comme lu
                      </button>
                    )}
                    
                    {notif.action_url && (
                      <a
                        href={notif.action_url}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition flex items-center gap-1.5"
                      >
                        Voir les détails →
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(notif.id)}
                      className={`ml-auto p-1.5 rounded-lg transition ${
                        darkMode ? "hover:bg-red-500/10 text-gray-500 hover:text-red-500" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
                      }`}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}