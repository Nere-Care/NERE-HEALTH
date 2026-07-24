import { Bell, FlaskConical, CalendarCheck, CreditCard, AlertCircle, FileText } from "lucide-react";

const ICON_BY_TYPE = {
  resultat_labo_disponible: FlaskConical,
  confirmation_rdv: CalendarCheck,
  rappel_rdv: CalendarCheck,
  annulation_rdv: CalendarCheck,
  confirmation_paiement: CreditCard,
  echec_paiement: CreditCard,
  remboursement: CreditCard,
  nouveau_message: Bell,
  alerte_systeme: Bell,
  compte_valide: Bell,
  compte_rejete: Bell,
  nouveaux_avis: Bell,
  document_ajoute: FileText,
};

export default function NotificationsPanel({ notifications = [], darkMode }) {
  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border transition
      ${
        darkMode
          ? "bg-gray-800 border-gray-700 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">
          Notifications
        </h2>
        <span className="text-xs text-gray-400">{notifications.length}</span>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {notifications.length === 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border dark:border-gray-700">
            <AlertCircle className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-400">Aucune notification</p>
          </div>
        )}
        {notifications.map((n, i) => {
          const Icon = ICON_BY_TYPE[n.type] || Bell;

          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition hover:shadow-sm
              ${
                darkMode
                  ? "bg-gray-900 border-gray-700 hover:bg-gray-800"
                  : "bg-gray-50 border-gray-200 hover:bg-white"
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0
                ${
                  n.type?.includes("paiement")
                    ? "bg-purple-100 text-purple-600"
                    : n.type?.includes("labo")
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm leading-relaxed">{n.titre || n.contenu}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{n.contenu}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}