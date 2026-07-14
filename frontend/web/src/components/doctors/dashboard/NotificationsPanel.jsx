import { Bell, FlaskConical, CalendarCheck, CreditCard, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationsPanel({ darkMode, notifications = [] }) {
  const navigate = useNavigate();

  const getIconConfig = (type) => {
    switch (type) {
      case "confirmation_paiement": return { icon: CreditCard,    bg: "bg-purple-100 text-purple-600" };
      case "resultat_labo_disponible": return { icon: FlaskConical, bg: "bg-green-100 text-green-600"  };
      case "rappel_rdv":
      case "confirmation_rdv":       return { icon: CalendarCheck, bg: "bg-blue-100 text-blue-600"    };
      case "nouveau_message":        return { icon: Stethoscope,   bg: "bg-orange-100 text-orange-600" };
      default:                       return { icon: Bell,          bg: "bg-blue-100 text-blue-600"    };
    }
  };

  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`}>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">Notifications recentes</h2>
        <button
          onClick={() => navigate("/notifications")}
          className="text-xs text-blue-500 hover:underline"
        >
          Voir tout
        </button>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucune notification
          </p>
        ) : (
          notifications.map((n, i) => {
            const { icon: Icon, bg } = getIconConfig(n.type);
            return (
              <div
                key={i}
                onClick={() => navigate(`/notification/${n.id}`)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition hover:shadow-sm cursor-pointer
                  ${darkMode ? "bg-gray-900 border-gray-700 hover:bg-gray-800" : "bg-gray-50 border-gray-200 hover:bg-white"}`}
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 ${bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{n.titre}</p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{n.contenu}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{n.created_at}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}