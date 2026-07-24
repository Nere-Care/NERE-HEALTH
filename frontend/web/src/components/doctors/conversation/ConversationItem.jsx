const STATUT_COLORS = {
  en_attente: "bg-yellow-100 text-yellow-700",
  acceptee: "bg-green-100 text-green-700",
  refusee: "bg-red-100 text-red-700",
};

const STATUT_LABELS = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
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
}) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition
      ${
        isSelected
          ? darkMode
            ? "bg-gray-700"
            : "bg-white shadow"
          : darkMode
          ? "hover:bg-gray-800"
          : "hover:bg-gray-200"
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        {chat.name?.charAt(0) || "?"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex justify-between items-start">
          <p className="text-sm font-semibold truncate">{chat.name}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
            {formatRelativeDate(chat.created_at)}
          </span>
        </div>

        {/* Subtitle: specialite or role */}
        {chat.demande_avis_id ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            {chat.demande_specialite && (
              <span className="text-[10px] text-blue-500 font-medium">
                {chat.demande_specialite}
              </span>
            )}
            {chat.demande_statut && STATUT_LABELS[chat.demande_statut] && (
              <span
                className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                  STATUT_COLORS[chat.demande_statut] || ""
                }`}
              >
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
