import { CalendarDays, Clock3, Video, MapPin, PhoneCall, User, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AppointmentListCard({
  item,
  getStatusStyle,
  darkMode,
  onReschedule,
  onOpenPatient,
  onChangerStatut,
}) {
  const navigate = useNavigate();

  const initiales = item.patientName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const Avatar = () => (
    <div
      onClick={() => onOpenPatient?.(item)}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition flex-shrink-0
        ${darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"}`}
    >
      {initiales}
    </div>
  );

  const BoutonsAction = ({ compact = false }) => {
    const btnBase = compact ? "px-3 py-1 text-xs" : "px-3 py-2 text-xs";
    return (
      <div className="flex flex-wrap gap-2">
        {/* Confirmer */}
        {item._statut_backend === "en_attente" && (
          <button
            onClick={() => onChangerStatut?.(item.id, "confirme")}
            title="Confirmer ce rendez-vous"
            className={`${btnBase} rounded-xl border flex items-center gap-1 transition
              ${darkMode
                ? "border-green-500 text-green-400 hover:bg-green-900/20"
                : "border-green-600 text-green-600 hover:bg-green-50"}`}
          >
            <CheckCircle size={12} />
            Confirmer
          </button>
        )}

        {/* Annuler */}
        {(item._statut_backend === "en_attente" || item._statut_backend === "confirme") && (
          <button
            onClick={() => onChangerStatut?.(item.id, "annule_medecin")}
            title="Annuler ce rendez-vous"
            className={`${btnBase} rounded-xl border flex items-center gap-1 transition
              ${darkMode
                ? "border-red-500 text-red-400 hover:bg-red-900/20"
                : "border-red-500 text-red-500 hover:bg-red-50"}`}
          >
            <XCircle size={12} />
            Annuler
          </button>
        )}

        {/* Reprogrammer */}
        {item._statut_backend !== "termine" && item._statut_backend !== "annule_medecin" && (
          <button
            onClick={() => onReschedule?.(item)}
            className={`${btnBase} rounded-xl border transition
              ${darkMode
                ? "border-gray-500 text-gray-400 hover:bg-gray-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            Reprogrammer
          </button>
        )}

        {/* Marquer terminé */}
        {item._statut_backend === "confirme" && (
          <button
            onClick={() => onChangerStatut?.(item.id, "termine")}
            className={`${btnBase} rounded-xl border transition
              ${darkMode
                ? "border-blue-500 text-blue-400 hover:bg-blue-900/20"
                : "border-blue-500 text-blue-500 hover:bg-blue-50"}`}
          >
            Terminer
          </button>
        )}

        {/* Rejoindre téléconsultation */}
        {item.type === "Teleconsultation" && item._statut_backend === "confirme" && (
          <button
            onClick={() => navigate("/teleconsultation")}
            className={`${btnBase} rounded-xl flex items-center gap-1 text-white transition
              ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-600 hover:bg-green-700"}`}
          >
            <PhoneCall size={12} />
            Rejoindre
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`border rounded-2xl p-4 transition-colors duration-300
      ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

      {/* MOBILE */}
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-3">
          <Avatar />
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
              {item.patientName}
            </p>
            {item.motif && (
              <p className={`text-xs truncate mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {item.motif}
              </p>
            )}
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${getStatusStyle(item.status, darkMode)}`}>
              {item.status}
            </span>
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-2 text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          <div className="flex items-center gap-1.5">
            <CalendarDays size={13} /> {item.date}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 size={13} /> {item.heure || item.time}
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            {item.type === "Teleconsultation"
              ? <><Video size={13} className="text-blue-400" /> Téléconsultation</>
              : <><MapPin size={13} className="text-green-500" /> Présentiel</>
            }
          </div>
        </div>

        <BoutonsAction />
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex items-center gap-4">

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar />
          <div className="min-w-0">
            <p className={`font-semibold truncate text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>
              {item.patientName}
            </p>
            {item.motif && (
              <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {item.motif}
              </p>
            )}
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs flex-shrink-0 ${getStatusStyle(item.status, darkMode)}`}>
          {item.status}
        </span>

        <div className={`flex items-center gap-2 text-sm flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <CalendarDays size={15} /> {item.date}
        </div>

        <div className={`flex items-center gap-2 text-sm flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          <Clock3 size={15} /> {item.heure || item.time}
        </div>

        <div className={`flex items-center gap-2 text-sm flex-shrink-0 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          {item.type === "Teleconsultation"
            ? <><Video size={15} className="text-blue-500" /> Téléconsultation</>
            : <><MapPin size={15} className="text-green-600" /> Présentiel</>
          }
        </div>

        <div className="flex-shrink-0">
          <BoutonsAction compact />
        </div>
      </div>
    </div>
  );
}