import { useState, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, Shield, HeartPulse, Calendar, Droplet } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PatientEditModal({ isOpen, onClose, patient, onSave, darkMode }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (patient) setForm(patient);
  }, [patient]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nom?.trim()) newErrors.nom = "Le nom est requis";
    if (!form.age || form.age < 1 || form.age > 120) newErrors.age = "Âge invalide";
    if (!form.telephone?.match(/^\+?[\d\s\-()]{8,}$/)) newErrors.telephone = "Téléphone invalide";
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("❌ Veuillez corriger les erreurs");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave({ ...form, id: patient.id });
      toast.success("✅ Patient mis à jour");
    } catch {
      toast.error("❌ Erreur lors de la modification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = `flex items-center gap-3 border rounded-2xl px-4 py-3 transition ${
    darkMode ? "border-slate-700 focus-within:border-blue-500" : "border-gray-300 focus-within:border-blue-500"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold">Modifier patient</h2>
            <p className="text-sm text-gray-400 mt-1">Mettre à jour les informations</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium">Nom complet *</label>
              <div className={fieldClass}>
                <User size={18} className="text-gray-400" />
                <input name="nom" value={form.nom || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Âge *</label>
              <div className={fieldClass}>
                <Calendar size={18} className="text-gray-400" />
                <input type="number" name="age" value={form.age || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Sexe</label>
              <select name="sexe" value={form.sexe || ""} onChange={handleChange} 
                className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}>
                <option value="">Choisir</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Téléphone *</label>
              <div className={fieldClass}>
                <Phone size={18} className="text-gray-400" />
                <input name="telephone" value={form.telephone || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <div className={fieldClass}>
                <Mail size={18} className="text-gray-400" />
                <input type="email" name="email" value={form.email || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Adresse</label>
              <div className={fieldClass}>
                <MapPin size={18} className="text-gray-400" />
                <input name="adresse" value={form.adresse || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Groupe sanguin</label>
              <select name="groupe" value={form.groupe || ""} onChange={handleChange} 
                className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}>
                <option value="">Sélectionner</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Assurance</label>
              <div className={fieldClass}>
                <Shield size={18} className="text-gray-400" />
                <input name="assurance" value={form.assurance || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Médecin</label>
              <div className={fieldClass}>
                <User size={18} className="text-gray-400" />
                <input name="medecin" value={form.medecin || ""} onChange={handleChange} className="w-full bg-transparent outline-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Statut</label>
              <select name="statut" value={form.statut || "Actif"} onChange={handleChange} 
                className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none ${
                  darkMode ? "border-slate-700" : "border-gray-300"
                }`}>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="En attente">En attente</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium">Allergies</label>
            <textarea name="allergies" value={form.allergies || ""} onChange={handleChange} rows={2}
              className={`mt-2 w-full border rounded-2xl px-4 py-3 bg-transparent outline-none resize-none ${
                darkMode ? "border-slate-700" : "border-gray-300"
              }`} />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Antécédents médicaux</label>
            <div className={`mt-2 flex gap-3 border rounded-2xl px-4 py-3 ${
              darkMode ? "border-slate-700" : "border-gray-300"
            }`}>
              <HeartPulse size={18} className="text-gray-400 mt-1" />
              <textarea name="antecedents" value={form.antecedents || ""} onChange={handleChange} rows={3}
                className="w-full bg-transparent outline-none resize-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-slate-700">
          <button onClick={onClose} disabled={isSubmitting}
            className={`px-5 py-3 rounded-2xl border font-medium transition ${
              darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
            }`}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={isSubmitting}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold transition shadow-lg disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Enregistrement...
              </>
            ) : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}