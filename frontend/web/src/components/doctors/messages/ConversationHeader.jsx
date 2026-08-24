import { ArrowLeft, MoreVertical, User, Lock, Unlock, Video } from "lucide-react";

export default function ConversationHeader({
  current,
  darkMode,
  onBack,
  onToggleStatus,
  onVideo,
  onOpenMenu,
}) {
  const isClosed = current?.statut === "fermee";

  return (
    <div
      className={`flex-shrink-0 flex justify-between items-center px-4 py-3 border-b
      ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="flex items-center gap-3">
        <button className="md:hidden" onClick={onBack}>
          <ArrowLeft size={20} className={darkMode ? "text-white" : "text-gray-700"} />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {current.name?.charAt(0) || <User size={18} />}
        </div>

        <div>
          <p className="font-semibold text-sm">{current.name}</p>
          <p className="text-xs text-gray-400">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onToggleStatus && (
          <button
            onClick={onToggleStatus}
            title={isClosed ? "Rouvrir la conversation" : "Fermer la conversation"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
              isClosed
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
            }`}
          >
            {isClosed ? <Lock size={14} /> : <Unlock size={14} />}
            <span className="hidden sm:inline">
              {isClosed ? "Fermée (Rouvrir)" : "Ouverte (Fermer)"}
            </span>
          </button>
        )}
        {onVideo && (
          <button
            onClick={onVideo}
            title="Planifier un RDV de téléconsultation"
            className={`p-2 rounded-xl transition ${
              darkMode ? "hover:bg-gray-700 text-green-400" : "hover:bg-gray-100 text-green-600"
            }`}
          >
            <Video className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onOpenMenu}
          title="Plus d'options"
          className={`p-2 rounded-xl transition ${
            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
