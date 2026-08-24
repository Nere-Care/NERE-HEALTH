import { Lock } from "lucide-react";

const STATUT_COLORS = {
  en_attente: "bg-yellow-100 text-yellow-700",
  acceptee: "bg-green-100 text-green-700",
  refusee: "bg-red-100 text-red-700",
  annulee: "bg-gray-100 text-gray-500",
  en_attente_paiement: "bg-amber-100 text-amber-800 border border-amber-200",
  en_attente_paiement_patient: "bg-purple-100 text-purple-800 border border-purple-200",
  cloturee: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 font-semibold border border-gray-300 dark:border-gray-600",
};

const STATUT_LABELS = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
  en_attente_paiement: "Facture émise",
  en_attente_paiement_patient: "Paiement patient",
  cloturee: "Clôturée",
};

function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function ConversationItem({
  chat,
  isSelected,
  onClick,
  darkMode,
  currentUserId,
}) {
  const isSent = chat.demande_avis_id && chat.demande_medecin_demandeur_id === currentUserId;
  const isCloturee = chat.demande_statut === "cloturee";

  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition relative
      ${
        isSelected
          ? darkMode
            ? "bg-gray-700"
            : "bg-white shadow"
          : darkMode
          ? "hover:bg-gray-800"
          : "hover:bg-gray-200"
      } ${isCloturee ? "opacity-90" : ""}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {chat.name?.charAt(0) || "?"}
        </div>
        {isCloturee && (
          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-gray-700 text-white flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm" title="Conversation clôturée">
            <Lock size={9} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold truncate flex items-center gap-1.5">
            {chat.name}
            {isCloturee && <Lock size={12} className="text-gray-400 flex-shrink-0" />}
          </p>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {chat.unread > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {chat.unread}
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {formatRelativeDate(chat.created_at)}
            </span>
          </div>
        </div>

        {/* Subtitle: specialite or role */}
        {chat.demande_avis_id ? (
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
              isSent ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
            }`}>
              {isSent ? "Envoyée" : "Reçue"}
            </span>
            {chat.demande_specialite && (
              <span className="text-[10px] text-gray-400 font-medium">
                Avis · <span className="text-blue-500">{chat.demande_specialite}</span>
              </span>
            )}
            {chat.demande_statut && STATUT_LABELS[chat.demande_statut] && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 rounded-full font-medium ${
                  STATUT_COLORS[chat.demande_statut] || ""
                }`}
              >
                {isCloturee && <Lock size={9} />}
                {STATUT_LABELS[chat.demande_statut]}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-0.5">Patient</p>
        )}

        {/* Motif or last message */}
        {chat.demande_avis_id && chat.demande_motif ? (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {chat.demande_motif}
          </p>
        ) : (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {chat.lastMessage}
          </p>
        )}
      </div>
    </div>
  );
}
