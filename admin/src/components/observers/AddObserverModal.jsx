import { X, Shield, FileText, Users, AlertTriangle, CheckCircle , Eye, Building2, Mail, Phone  } from "lucide-react";

export default function AddObserverModal({ darkMode, formData, setFormData, isSubmitting, onSubmit, onClose, togglePermission }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('watched.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        watched: { ...prev.watched, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const inputClass = `w-full mt-1.5 p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
    darkMode ? "border-slate-700" : "border-gray-300"
  }`;

  const permissions = [
    { id: "lecture", label: "Lecture seule", icon: Eye },
    { id: "rapports", label: "Générer rapports", icon: FileText },
    { id: "alertes", label: "Gérer alertes", icon: AlertTriangle },
    { id: "admin", label: "Administration", icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Gradient Header */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Ajouter un observateur</h2>
            <p className="text-sm text-gray-400 mt-0.5">Configurer un nouvel organisme de surveillance</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nom de l'organisme *</label>
              <input name="name" value={formData.name} onChange={handleChange} 
                placeholder="Ex: ONG Santé Globale" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium">Rôle *</label>
              <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                <option value="">Sélectionner</option>
                <option value="Audit national">Audit national</option>
                <option value="État">État</option>
                <option value="Audit sécurité">Audit sécurité</option>
                <option value="Recherche">Recherche</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Scope de surveillance *</label>
            <input name="scope" value={formData.scope} onChange={handleChange} 
              placeholder="Ex: Surveillance système santé national" className={inputClass} />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} 
                placeholder="contact@org.cm" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium">Téléphone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} 
                placeholder="+237 6XX XXX XXX" className={inputClass} />
            </div>
          </div>

          {/* Watched Data */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Users size={14} className="text-gray-400" /> Données surveillées
            </label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {["patients", "doctors", "structures"].map((field) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 capitalize">{field}</label>
                  <input type="number" name={`watched.${field}`} value={formData.watched?.[field] || 0} 
                    onChange={handleChange} className={`${inputClass} text-sm py-2`} min="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-sm font-medium">Niveau de risque</label>
            <select name="watched.activityRisk" value={formData.watched?.activityRisk || "Faible"} onChange={handleChange} className={inputClass}>
              <option value="Faible">🟢 Faible</option>
              <option value="Stable">🟡 Stable</option>
              <option value="Élevé">🔴 Élevé</option>
            </select>
          </div>

          {/* Permissions */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Shield size={14} className="text-gray-400" /> Permissions d'accès
            </label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {permissions.map((perm) => {
                const Icon = perm.icon;
                const isActive = formData.permissions?.includes(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-500"
                        : darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-sm">{perm.label}</span>
                    {isActive && <CheckCircle size={14} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t dark:border-slate-700">
          <button onClick={onClose} disabled={isSubmitting}
            className={`flex-1 py-3 rounded-xl border font-medium transition ${
              darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
            Annuler
          </button>
          <button onClick={onSubmit} disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Ajout...</>
            ) : "Ajouter l'observateur"}
          </button>
        </div>
      </div>
    </div>
  );
}