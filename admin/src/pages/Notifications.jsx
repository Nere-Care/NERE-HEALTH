import { useState, useEffect, useCallback } from "react";
import {
  Bell, BellOff, CheckCheck, Trash2, Clock, Info,
  AlertTriangle, CheckCircle, MessageCircle, CreditCard,
  FileText, Pill, UserCheck, RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import API from "../services/api";

const TYPE_CONFIG = {
  rappel_rdv: { icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", label: "Rappel RDV" },
  confirmation_rdv: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Confirmation RDV" },
  annulation_rdv: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Annulation RDV" },
  confirmation_paiement: { icon: CreditCard, color: "text-green-500", bg: "bg-green-500/10", label: "Paiement confirmé" },
  echec_paiement: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Échec paiement" },
  remboursement: { icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10", label: "Remboursement" },
  nouveau_message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-500/10", label: "Nouveau message" },
  resultat_labo_disponible: { icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10", label: "Résultat labo" },
  ordonnance_prete: { icon: Pill, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Ordonnance prête" },
  alerte_systeme: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-500/10", label: "Alerte système" },
  compte_valide: { icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10", label: "Compte validé" },
  compte_rejete: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Compte rejeté" },
  nouveaux_avis: { icon: CheckCircle, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Nouvel avis" },
  document_ajoute: { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", label: "Document ajouté" },
  rappel_prise_medicament: { icon: Pill, color: "text-pink-500", bg: "bg-pink-500/10", label: "Rappel médicament" },
  reponse_ticket: { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: "Réponse ticket" },
  demande_reprogrammation: { icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-500/10", label: "Reprogrammation demandée" },
  acceptation_reprogrammation: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Reprogrammation acceptée" },
  refus_reprogrammation: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10", label: "Reprogrammation refusée" },
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export default function Notifications({ darkMode }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/notifications", { limit: 100 });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Erreur de chargement des notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id) => {
    try {
      await API.put(`/notifications/${id}/lu`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, statut: "lu" } : n))
      );
    } catch {
      toast.error("Erreur");
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await API.put("/notifications/lu-toutes");
      setNotifications((prev) => prev.map((n) => ({ ...n, statut: "lu" })));
      toast.success("Toutes les notifications marquées comme lues");
    } catch {
      toast.error("Erreur");
    }
  }, []);

  const unreadCount = notifications.filter((n) => n.statut !== "lu").length;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#0f172a]" : "bg-gray-100"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-6 ${darkMode ? "bg-[#0f172a] text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className="flex flex-col mt-6 sm:mt-0 sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow flex items-center gap-2"
          >
            <CheckCheck size={16} />
            Tout marquer lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={`rounded-3xl border p-10 text-center ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <BellOff size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || { icon: Bell, color: "text-gray-500", bg: "bg-gray-500/10", label: notif.type };
            const Icon = config.icon;
            const isUnread = notif.statut !== "lu";

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && handleMarkRead(notif.id)}
                className={`
                  rounded-2xl border p-4 flex items-start gap-4 transition cursor-pointer
                  ${isUnread
                    ? darkMode
                      ? "bg-slate-800/80 border-blue-500/30 hover:bg-slate-800"
                      : "bg-blue-50/50 border-blue-200 hover:bg-blue-50"
                    : darkMode
                      ? "bg-slate-900 border-slate-800 hover:bg-slate-800/50"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <Icon size={18} className={config.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <h3 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {notif.titre}
                  </h3>
                  <p className={`text-sm mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {notif.contenu}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
