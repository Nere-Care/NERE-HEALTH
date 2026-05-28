import { useState } from "react";
import { X, User, Phone, Mail, MapPin, Shield, HeartPulse, Calendar, Droplet } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PatientAddModal({ isOpen, onClose, onAdd, darkMode }) {
  const [formData, setFormData] = useState({
    nom: "", age: "", sexe: "", telephone: "", email: "", adresse: "",
    groupe: "", assurance: "", allergies: "", antecedents: "", medecin: "", statut: "Actif"
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.age || formData.age < 1 || formData.age > 120) newErrors.age = "Âge invalide";
    if (!formData.sexe) newErrors.sexe = "Sélectionnez un sexe";
    if (!formData.telephone.match(/^\+?[\d\s\-()]{8,}$/)) newErrors.telephone = "Téléphone invalide";
    if (formData.email && !formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/)) {
      newErrors.email = "Email invalide";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("❌ Veuillez corriger les erreurs");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Simulation API
      await new Promise(resolve => setTimeout(resolve, 500));
      onAdd(formData);
      setFormData({
        nom: "", age: "", sexe: "", telephone: "", email: "", adresse: "",
        groupe: "", assurance: "", allergies: "", antecedents: "", medecin: "", statut: "Actif"
      });
    } catch (error) {
      toast.error("❌ Erreur lors de l'ajout");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = `w-full bg-transparent outline-none placeholder-gray-400`;
  const fieldClass = `mt-2 flex items-center gap-3 border rounded-2xl px-4 py-3 transition ${
    darkMode ? "border-slate-700 focus-within:border-blue-500" : "border-gray-300 focus-within:border-blue-500"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold">Ajouter un patient</h2>
            <p className="text-sm text-gray-400 mt-1">Enregistrer un nouveau patient dans le système</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Nom */}
            <div>
              <label className="text-sm font-medium">Nom complet *</label>
              <div className={fieldClass}>
                <User size={18} className="text-gray-400" />
                <input type="text" name="nom" value={formData.nom} onChange={handleChange} 
                  placeholder="Jean Mbappe" className={inputClass} />
              </div>
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="text-sm font-medium">Âge *</label>
              <div className={fieldClass}>
                <Calendar size={18} className="text-gray-400" />
                <input type="number" name="age" value={formData.age} onChange={handleChange} 
                  placeholder="30" min="1" max="120" className={inputClass} />
              </div>
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>

            {/* Sexe */}
            <div>
              <label className="text-sm font-medium">Sexe *</label>
              <select name="sexe" value={formData.sexe} onChange={handleChange} 
                className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none transition ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}>
                <option value="">Choisir</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
              {errors.sexe && <p className="text-red-500 text-xs mt-1">{errors.sexe}</p>}
            </div>

            {/* Téléphone */}
            <div>
              <label className="text-sm font-medium">Téléphone *</label>
              <div className={fieldClass}>
                <Phone size={18} className="text-gray-400" />
                <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} 
                  placeholder="+237 690000000" className={inputClass} />
              </div>
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className={fieldClass}>
                <Mail size={18} className="text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} 
                  placeholder="patient@gmail.com" className={inputClass} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Adresse */}
            <div>
              <label className="text-sm font-medium">Adresse</label>
              <div className={fieldClass}>
                <MapPin size={18} className="text-gray-400" />
                <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} 
                  placeholder="Douala" className={inputClass} />
              </div>
            </div>

            {/* Groupe sanguin */}
            <div>
              <label className="text-sm font-medium">Groupe sanguin</label>
              <div className={fieldClass}>
                <Droplet size={18} className="text-gray-400" />
                <select name="groupe" value={formData.groupe} onChange={handleChange} className={inputClass}>
                  <option value="">Sélectionner</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assurance */}
            <div>
              <label className="text-sm font-medium">Assurance</label>
              <div className={fieldClass}>
                <Shield size={18} className="text-gray-400" />
                <input type="text" name="assurance" value={formData.assurance} onChange={handleChange} 
                  placeholder="CNPS" className={inputClass} />
              </div>
            </div>

            {/* Médecin */}
            <div>
              <label className="text-sm font-medium">Médecin traitant</label>
              <div className={fieldClass}>
                <User size={18} className="text-gray-400" />
                <input type="text" name="medecin" value={formData.medecin} onChange={handleChange} 
                  placeholder="Dr Njoya" className={inputClass} />
              </div>
            </div>

            {/* Statut */}
            <div>
              <label className="text-sm font-medium">Statut</label>
              <select name="statut" value={formData.statut} onChange={handleChange} 
                className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="text-sm font-medium">Allergies</label>
            <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows={2}
              placeholder="Aucune" className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none resize-none ${
                darkMode ? "border-slate-700" : "border-gray-300"
              }`} />
          </div>

          {/* Antécédents */}
          <div>
            <label className="text-sm font-medium">Antécédents médicaux</label>
            <div className={`mt-2 flex gap-3 border rounded-2xl px-4 py-3 ${
              darkMode ? "border-slate-700" : "border-gray-300"
            }`}>
              <HeartPulse size={18} className="text-gray-400 mt-1" />
              <textarea name="antecedents" value={formData.antecedents} onChange={handleChange} rows={3}
                placeholder="Diabète, hypertension..." className="w-full bg-transparent outline-none resize-none" />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className={`px-5 py-3 rounded-2xl border font-medium transition ${
                darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Ajout...
                </>
              ) : "Ajouter le patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}