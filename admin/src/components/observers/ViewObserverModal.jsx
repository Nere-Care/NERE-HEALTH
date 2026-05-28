import { X, Shield, Users, Activity, Clock, AlertTriangle, FileText, Download, Trash2, Edit, Mail, Phone, Calendar } from "lucide-react";

export default function ViewObserverModal({ darkMode, observer, onClose, onToggleStatus, onExport, onDelete, getStatusBadge, getRiskColor }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {observer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{observer.name}</h2>
              <p className="text-sm text-gray-400">ID: #{observer.id} • {observer.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Status & Sync */}
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(observer.status)}
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock size={14} /> Dernière sync: {observer.lastSync}
            </span>
            {observer.alerts > 0 && (
              <span className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle size={14} /> {observer.alerts} alerte{observer.alerts > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={FileText} label="Scope" value={observer.scope} darkMode={darkMode} />
            <InfoItem icon={Shield} label="Rôle" value={observer.role} darkMode={darkMode} />
            <InfoItem icon={Mail} label="Email" value={observer.email} darkMode={darkMode} />
            <InfoItem icon={Phone} label="Téléphone" value={observer.phone} darkMode={darkMode} />
            <InfoItem icon={Calendar} label="Créé le" value={observer.createdAt} darkMode={darkMode} />
            <InfoItem icon={Activity} label="Niveau de risque" value={observer.watched?.activityRisk} darkMode={darkMode} risk={observer.watched?.activityRisk} getRiskColor={getRiskColor} />
          </div>

          {/* Watched Data */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500" /> Données sous surveillance
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Patients", value: observer.watched?.patients, icon: Users },
                { label: "Médecins", value: observer.watched?.doctors, icon: Users },
                { label: "Structures", value: observer.watched?.structures, icon: Building2 },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className={`p-4 rounded-xl text-center ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                    <Icon size={20} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{item.value?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          {observer.permissions?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield size={16} className="text-purple-500" /> Permissions
              </h3>
              <div className="flex flex-wrap gap-2">
                {observer.permissions.map((perm, i) => (
                  <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    darkMode ? "bg-slate-800 text-blue-400" : "bg-blue-50 text-blue-600"
                  }`}>
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`p-5 border-t dark:border-slate-700 space-y-4 ${
          darkMode ? "bg-slate-900/50" : "bg-gray-50"
        }`}>
          
          {/* Toggle Status */}
          <button onClick={onToggleStatus}
            className={`w-full py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              observer.status === "Actif"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}>
            <Edit size={18} /> {observer.status === "Actif" ? "Suspendre" : "Activer"} cet observateur
          </button>

          {/* Other Actions */}
          <div className="flex gap-2">
            <button onClick={onExport}
              className={`flex-1 py-2.5 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                darkMode ? "border-slate-600 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}>
              <Download size={16} /> Exporter
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

function InfoItem({ icon: Icon, label, value, darkMode, risk, getRiskColor }) {
  return (
    <div className={`p-4 rounded-xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
        <Icon size={12} /> {label}
      </p>
      <p className={`font-medium text-sm ${risk ? getRiskColor?.(risk) : ''}`}>
        {value || "—"}
      </p>
    </div>
  );
}

const Building2 = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
  </svg>
);