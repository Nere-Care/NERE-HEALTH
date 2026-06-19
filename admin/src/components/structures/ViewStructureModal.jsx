import { X, Building2, MapPin, Phone, Mail, UserCircle, Users, FileText, Edit2, Trash2, Eye, Activity } from "lucide-react";

export default function ViewStructureModal({ darkMode, structure, onClose, onToggleStatus, onViewDocs, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {structure.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{structure.name}</h2>
              <p className="text-sm text-gray-400">ID: #{structure.id} • {structure.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Status & Date */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
              structure.status === "Actif" 
                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                : "bg-red-500/10 text-red-500 border-red-500/20"
            }`}>
              {structure.status}
            </span>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Activity size={14} /> Ajouté le {structure.createdAt}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={MapPin} label="Adresse" value={structure.address} darkMode={darkMode} />
            <InfoItem icon={MapPin} label="Ville" value={structure.city} darkMode={darkMode} />
            <InfoItem icon={Phone} label="Téléphone" value={structure.phone} darkMode={darkMode} />
            <InfoItem icon={Mail} label="Email" value={structure.email} darkMode={darkMode} />
            <InfoItem icon={UserCircle} label="Responsable" value={structure.manager} darkMode={darkMode} />
            <InfoItem icon={Users} label="Professionnels" value={`${structure.professionals} personnes`} darkMode={darkMode} />
          </div>

          {/* Documents Preview */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-500" /> Documents ({structure.documents?.length || 0})
            </h3>
            {structure.documents?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {structure.documents.slice(0, 3).map((doc, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-lg text-xs ${
                    darkMode ? "bg-slate-800" : "bg-gray-100"
                  }`}>
                    {doc.name}
                  </span>
                ))}
                {structure.documents.length > 3 && (
                  <span className="px-3 py-1.5 rounded-lg text-xs text-gray-400">
                    +{structure.documents.length - 3} autres
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun document enregistré</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`p-5 border-t dark:border-slate-700 space-y-4 ${
          darkMode ? "bg-slate-900/50" : "bg-gray-50"
        }`}>
          
          {/* Toggle Status Button */}
          <button onClick={onToggleStatus}
            className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              structure.status === "Actif"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}>
            <Edit2 size={18} /> {structure.status === "Actif" ? "Désactiver" : "Activer"} cette structure
          </button>

          {/* Other Actions */}
          <div className="flex gap-2">
            <button onClick={onViewDocs}
              className={`flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              <Eye size={16} /> Documents
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