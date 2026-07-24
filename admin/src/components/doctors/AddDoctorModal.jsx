import { X, User, Briefcase, Building2, Phone, Mail, MapPin, Stethoscope, FileText } from "lucide-react";

const PROFESSIONS = [
  { value: "medecin", label: "Médecin" },
  { value: "infirmier", label: "Infirmier / Infirmière" },
];

const DOCTOR_SPECIALTIES = [
  "Généraliste", "Cardiologue", "Dermatologue", "Pédiatre",
  "Gynécologue", "Neurologue", "Dentiste", "Orthopédiste", "Ophtalmologue",
];

const NURSE_SPECIALTIES = [
  "Sage-femme", "Infirmier urgentiste", "Infirmier pédiatrique",
  "Infirmier de soins intensifs", "Infirmier chirurgical", "Infirmier communautaire",
];

export default function AddDoctorModal({ darkMode, formData, setFormData, isSubmitting, onSubmit, onClose, specialitesList, structuresList, editingId }) {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const specialtyOptions = formData.role === "infirmier" || formData.role === "sage_femme"
    ? NURSE_SPECIALTIES
    : DOCTOR_SPECIALTIES;

  const inputClass = `w-full mt-1.5 p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
    darkMode ? "border-slate-700" : "border-gray-300"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">{editingId ? "Modifier le professionnel" : "Ajouter un professionnel"}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Informations professionnelles</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <User size={14} className="text-gray-400" /> Nom complet *
            </label>
            <input name="name" value={formData.name} onChange={handleChange} 
              placeholder="Dr. Martin Nkono" className={inputClass} />
          </div>

          {!editingId && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Stethoscope size={14} className="text-gray-400" /> Profession *
              </label>
              <select name="role" value={formData.role} onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value, specialty: "" }))} className={inputClass}>
                {PROFESSIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase size={14} className="text-gray-400" /> Spécialité *
            </label>
            <select name="specialty" value={formData.specialty} onChange={handleChange} className={inputClass}>
              <option value="">Sélectionner une spécialité</option>
              {specialtyOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> Hôpital / Structure
            </label>
            <select name="hospital" value={formData.hospital} onChange={handleChange} className={inputClass}>
              <option value="">Sélectionner une structure</option>
              {structuresList.map(s => (
                <option key={s.id} value={s.nom_etablissement}>{s.nom_etablissement}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText size={14} className="text-gray-400" /> Numéro d'ordre professionnel
            </label>
            <input name="numero_ordre" value={formData.numero_ordre} onChange={handleChange}
              placeholder="ORD-XXXXXXXX" className={inputClass} />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase size={14} className="text-gray-400" /> Années d'expérience
            </label>
            <input type="number" name="annees_experience" value={formData.annees_experience} onChange={handleChange}
              placeholder="5" min="0" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} className="text-gray-400" /> Téléphone
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} 
                placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-gray-400" /> Email
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} 
                placeholder="email@hopital.cm" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> Adresse
            </label>
            <input name="address" value={formData.address} onChange={handleChange} 
              placeholder="Douala, Bonanjo" className={inputClass} />
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
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> {editingId ? "Modification..." : "Ajout..."}</>
            ) : (editingId ? "Modifier" : "Ajouter")}
          </button>
        </div>
      </div>
    </div>
  );
}