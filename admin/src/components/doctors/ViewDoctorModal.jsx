import { X, Building2, Phone, Mail, MapPin, Calendar, FileText, CheckCircle, XCircle, Edit2, Trash2, Eye } from "lucide-react";

export default function ViewDoctorModal({ darkMode, doctor, onClose, onVerify, onReject, onStatusChange, onViewDocs, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
              {doctor.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{doctor.name}</h2>
              <p className="text-sm text-gray-400">ID: #{doctor.id} • {doctor.specialty}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
              doctor.status === "Vérifié" ? "bg-green-500/10 text-green-500 border-green-500/20" :
              doctor.status === "En attente" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
              "bg-red-500/10 text-red-500 border-red-500/20"
            }`}>
              {doctor.status}
            </span>
            <span className="text-sm text-gray-400">
              Ajouté le {doctor.createdAt}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={Building2} label="Hôpital" value={doctor.hospital} darkMode={darkMode} />
            <InfoItem icon={Phone} label="Téléphone" value={doctor.phone} darkMode={darkMode} />
            <InfoItem icon={Mail} label="Email" value={doctor.email} darkMode={darkMode} />
            <InfoItem icon={MapPin} label="Adresse" value={doctor.address} darkMode={darkMode} />
          </div>

          {/* Documents Preview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Documents ({doctor.documents?.length || 0})
            </h3>
            {doctor.documents?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {doctor.documents.slice(0, 3).map((doc, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-lg text-xs ${
                    darkMode ? "bg-slate-800" : "bg-gray-100"
                  }`}>
                    {doc.name}
                  </span>
                ))}
                {doctor.documents.length > 3 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-gray-400">
                    +{doctor.documents.length - 3} autres
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun document</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-5 border-t dark:border-slate-700 space-y-4 ${
          darkMode ? "bg-slate-900/50" : "bg-gray-50"
        }`}>
          
          {/* Validation Buttons - Only show if pending */}
          {doctor.status === "En attente" && (
            <div className="flex gap-3">
              <button onClick={() => onStatusChange("Vérifié")}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2">
                <CheckCircle size={18} /> Vérifier
              </button>
              <button onClick={() => onStatusChange("Rejeté")}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2">
                <XCircle size={18} /> Rejeter
              </button>
            </div>
          )}

          {/* Other Actions */}
          <div className="flex gap-2">
            <button onClick={onViewDocs}
              className={`flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              <Eye size={16} /> Documents
            </button>
            <button onClick={onEdit}
              className={`flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              <Edit2 size={16} /> Modifier
            </button>
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

// Helper component
function InfoItem({ icon: Icon, label, value, darkMode }) {
  return (
    <div className={`p-4 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        <Icon size={12} /> {label}
      </p>
      <p className="font-medium text-sm truncate">{value || "—"}</p>
    </div>
  );
}