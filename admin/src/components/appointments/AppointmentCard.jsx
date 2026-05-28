import { User, Building2, Stethoscope, Clock, Video, MapPin, Link2, Eye, CheckCircle2, XCircle, Trash2 } from "lucide-react";

export default function AppointmentCard({ 
  appointment, darkMode, cardClass, onView, onConfirm, onCancel, onDelete, 
  getStatusBadge, formatDate 
}) {
  const isOnline = appointment.mode === "En ligne";
  const isToday = appointment.date === new Date().toISOString().split("T")[0];

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border space-y-4 transition hover:shadow-lg overflow-hidden ${cardClass} ${
        darkMode ? "hover:border-slate-700" : "hover:border-gray-300"
      } ${isToday ? "ring-2 ring-blue-500/30" : ""}`}
    >
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`p-2 sm:p-2.5 rounded-xl flex-shrink-0 ${
            darkMode ? "bg-blue-500/10" : "bg-blue-50"
          }`}
        >
          {isOnline ? (
            <Video className="text-blue-500" size={18} />
          ) : (
            <MapPin className="text-blue-500" size={18} />
          )}
        </div>

        <div className="flex-shrink-0">
          {getStatusBadge(appointment.status)}
        </div>
      </div>

      {/* Patient Name */}
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold break-words leading-snug">
          {appointment.patient}
        </h2>

        <p className="text-sm text-gray-400 break-words line-clamp-2">
          {appointment.reason}
        </p>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm min-w-0">
        <InfoRow
          icon={User}
          label="Professionnel"
          value={appointment.professional}
          darkMode={darkMode}
        />

        <InfoRow
          icon={Building2}
          label="Structure"
          value={appointment.structure}
          darkMode={darkMode}
        />

        <InfoRow
          icon={Clock}
          label="Date"
          value={`${formatDate(appointment.date)} • ${appointment.time}`}
          darkMode={darkMode}
        />
        
        {/* Location/Link */}
        <div className="flex items-start gap-2 text-gray-400 min-w-0">
          {isOnline ? (
            <Video size={14} className="mt-0.5 flex-shrink-0" />
          ) : (
            <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            {isOnline ? (
              <a
                href={appointment.location}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 break-all text-sm"
              >
                <Link2 size={12} className="flex-shrink-0" />
                <span className="truncate sm:break-all">
                  Rejoindre la visio
                </span>
              </a>
            ) : (
              <span className="block break-words text-sm">
                {appointment.location}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t dark:border-slate-800">
        
        {/* Mobile */}
        <div className="flex flex-col sm:hidden gap-2">
          
          <button
            onClick={onView}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
            }`}
          >
            <Eye size={14} />
            Voir
          </button>

          {appointment.status === "En attente" && (
            <>
              <button
                onClick={onConfirm}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Confirmer
              </button>

              <button
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                Annuler
              </button>
            </>
          )}

          <button
            onClick={onDelete}
            className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center gap-1.5"
            title="Supprimer"
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>

        {/* Desktop */}
        <div className="hidden sm:flex gap-2">
          
          <button
            onClick={onView}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
              darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
            }`}
          >
            <Eye size={14} />
            <span className="truncate">Voir</span>
          </button>
          
          {appointment.status === "En attente" && (
            <>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-green-500/10 text-green-500 hover:bg-green-500/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span className="truncate">Confirmer</span>
              </button>

              <button
                onClick={onCancel}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition flex items-center justify-center gap-1.5"
              >
                <XCircle size={14} />
                <span className="truncate">Annuler</span>
              </button>
            </>
          )}
          
          <button
            onClick={onDelete}
            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex-shrink-0"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, darkMode }) {
  return (
    <div className="flex items-start gap-2 text-gray-400 min-w-0">
      <Icon size={14} className="mt-0.5 flex-shrink-0" />

      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="text-xs text-gray-500">
          {label}:{" "}
        </span>

        <span
          className={`break-words ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}