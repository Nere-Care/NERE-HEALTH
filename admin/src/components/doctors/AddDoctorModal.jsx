import { X, User, Briefcase, Building2, Phone, Mail, MapPin } from "lucide-react";

export default function AddDoctorModal({ darkMode, formData, setFormData, isSubmitting, onSubmit, onClose }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = `w-full mt-1.5 p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
    darkMode 
      ? "border-slate-700 text-white placeholder-gray-500" 
      : "border-gray-300 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">Ajouter un médecin</h2>
            <p className="text-sm text-gray-400 mt-0.5">Informations professionnelles et de contact</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">
          
          {/* Identité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <User size={14} className="text-gray-400" /> Prénom *
              </label>
              <input 
                name="prenom" 
                value={formData.prenom || ""} 
                onChange={handleChange} 
                placeholder="Martin" 
                className={inputClass} 
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <User size={14} className="text-gray-400" /> Nom *
              </label>
              <input 
                name="nom" 
                value={formData.nom || ""} 
                onChange={handleChange} 
                placeholder="Nkono" 
                className={inputClass} 
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-gray-400" /> Email *
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email || ""} 
                onChange={handleChange} 
                placeholder="martin.nkono@hopital.cm" 
                className={inputClass} 
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} className="text-gray-400" /> Téléphone
              </label>
              <input 
                name="telephone" 
                value={formData.telephone || ""} 
                onChange={handleChange} 
                placeholder="+237 6XX XXX XXX" 
                className={inputClass} 
              />
            </div>
          </div>

          {/* Professionnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase size={14} className="text-gray-400" /> Spécialité *
              </label>
              <input 
                name="specialite" 
                value={formData.specialite || ""} 
                onChange={handleChange} 
                placeholder="Cardiologue" 
                className={inputClass} 
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" /> Hôpital / Structure
              </label>
              <input 
                name="structure" 
                value={formData.structure || ""} 
                onChange={handleChange} 
                placeholder="Hôpital Laquintinie" 
                className={inputClass} 
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> Ville / Adresse
            </label>
            <input 
              name="adresse" 
              value={formData.adresse || ""} 
              onChange={handleChange} 
              placeholder="Douala, Bonanjo" 
              className={inputClass} 
            />
          </div>

        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t dark:border-slate-700 flex-shrink-0">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className={`flex-1 py-3 rounded-xl border font-medium transition ${
              darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Annuler
          </button>
          <button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Ajout...</>
            ) : "Ajouter le médecin"}
          </button>
        </div>
      </div>
    </div>
  );
}