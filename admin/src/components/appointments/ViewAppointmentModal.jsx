import { X, Calendar, Clock, User, Building2, Stethoscope, Video, MapPin, Link2, CheckCircle2, XCircle, Trash2, Edit } from "lucide-react";

export default function ViewAppointmentModal({ darkMode, appointment, onClose, onConfirm, onCancel, onDelete, getStatusBadge, formatDate }) {
  const isOnline = appointment.mode === "En ligne";
  const isToday = appointment.date === new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold ${
              isOnline ? "bg-gradient-to-br from-purple-500 to-indigo-600" : "bg-gradient-to-br from-blue-500 to-cyan-600"
            }`}>
              {isOnline ? <Video size={24} /> : <MapPin size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{appointment.patient}</h2>
              <p className="text-sm text-gray-400">ID: #{appointment.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[55vh] overflow-y-auto">
          
          {/* Status & Date */}
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(appointment.status)}
            {isToday && <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">📅 Aujourd'hui</span>}
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock size={14} /> {formatDate(appointment.date)} • {appointment.time}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <DetailRow icon={User} label="Professionnel" value={appointment.professional} darkMode={darkMode} />
            <DetailRow icon={Building2} label="Structure" value={appointment.structure} darkMode={darkMode} />
            <DetailRow icon={Stethoscope} label="Raison" value={appointment.reason} darkMode={darkMode} />
            
            {/* Location */}
            <div className={`p-4 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                {isOnline ? <Video size={12} /> : <MapPin size={12} />}
                {appointment.mode}
              </p>
              {isOnline ? (
                <a href={appointment.location} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-2 font-medium"
                >
                  <Link2 size={14} /> {appointment.location}
                </a>
              ) : (
                <p className="font-medium">{appointment.location}</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className={`p-4 rounded-xl text-sm ${darkMode ? "bg-slate-800/50" : "bg-gray-100"}`}>
            <p className="text-gray-400">Créé le {formatDate(appointment.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className={`p-5 border-t dark:border-slate-700 space-y-4 ${
          darkMode ? "bg-slate-900/50" : "bg-gray-50"
        }`}>
          
          {/* Status Actions */}
          {appointment.status === "En attente" && (
            <div className="flex gap-3">
              <button onClick={onConfirm}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Confirmer
              </button>
              <button onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition flex items-center justify-center gap-2">
                <XCircle size={18} /> Annuler
              </button>
            </div>
          )}

          {/* Other Actions */}
          <div className="flex gap-2">
            {isOnline && appointment.status !== "Annulé" && (
              <a href={appointment.location} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
              >
                <Video size={16} /> Rejoindre
              </a>
            )}
            <button onClick={onDelete}
              className="p-2.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, darkMode }) {
  return (
    <div className={`p-4 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        <Icon size={12} /> {label}
      </p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}