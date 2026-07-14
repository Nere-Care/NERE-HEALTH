import { useState } from "react";
import { Save, X, AlertCircle, CheckCircle } from "lucide-react";
import { creerConsultation } from "../../../services/patientService";

export default function NewConsultationForm({ selectedPatient, setIsNewConsultation, onSuccess, darkMode }) {
  const [formData, setFormData] = useState({
    motif: "",
    examen_clinique: "",
    diagnostic_principal: "",
    plan_traitement: "",
    observations: "",
    prescription_texte: "",
    demande_labo: "",
    date_prochain_rdv: "",
    priorite: "normal",
  });
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [succes, setSucces] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.motif.trim()) {
      setErreur("Le motif de consultation est obligatoire.");
      return;
    }
    try {
      setSaving(true);
      setErreur(null);
      await creerConsultation({
        patient_id: selectedPatient.id,
        ...formData,
      });
      setSucces(true);
      setTimeout(() => { onSuccess?.(); }, 1500);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `border p-3 rounded-xl w-full text-sm outline-none focus:ring-2 focus:ring-blue-500
    ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300"}`;

  if (succes) return (
    <div className={`mt-6 p-6 rounded-2xl flex flex-col items-center gap-3 ${darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"}`}>
      <CheckCircle size={40} className="text-green-500" />
      <p className={`font-semibold ${darkMode ? "text-green-300" : "text-green-700"}`}>Consultation enregistree avec succes</p>
    </div>
  );

  return (
    <div className={`mt-6 p-5 border rounded-2xl space-y-5 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-800"}`}>
          Nouvelle consultation clinique
        </h3>
        <button onClick={() => setIsNewConsultation(false)}>
          <X size={20} className={darkMode ? "text-gray-400" : "text-gray-500"} />
        </button>
      </div>

      {/* Contexte patient */}
      <div className={`p-3 rounded-xl text-sm ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
          {selectedPatient?.nom} — {selectedPatient?.numero_patient}
        </p>
        <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
          {selectedPatient?.age ? `${selectedPatient.age} ans` : ""} {selectedPatient?.sexe === "M" ? "• Homme" : selectedPatient?.sexe === "F" ? "• Femme" : ""}
        </p>
      </div>

      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      <div className="space-y-2">
        <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
          Motif de consultation <span className="text-red-500">*</span>
        </label>
        <input name="motif" value={formData.motif} onChange={handleChange}
          placeholder="Raison principale de la consultation" className={inputClass} />
      </div>

      <div className="space-y-2">
        <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Examen clinique</label>
        <textarea name="examen_clinique" value={formData.examen_clinique} onChange={handleChange}
          rows={3} placeholder="Resultats de l'examen physique..." className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Diagnostic</label>
          <input name="diagnostic_principal" value={formData.diagnostic_principal} onChange={handleChange}
            placeholder="Ex: Rhinopharyngite aigue" className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Plan de traitement</label>
          <input name="plan_traitement" value={formData.plan_traitement} onChange={handleChange}
            placeholder="Ex: Repos, hydratation..." className={inputClass} />
        </div>
      </div>

      <div className="space-y-2">
        <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Prescription</label>
        <textarea name="prescription_texte" value={formData.prescription_texte} onChange={handleChange}
          rows={3} placeholder="Medicament - Posologie - Duree&#10;Ex: Amoxicilline 1g - 3x/jour - 7 jours" className={inputClass} />
      </div>

      <div className="space-y-2">
        <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Demandes de laboratoire</label>
        <input name="demande_labo" value={formData.demande_labo} onChange={handleChange}
          placeholder="Ex: NFS, glycemie, bilan lipidique..." className={inputClass} />
      </div>

      <div className="space-y-2">
        <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Notes cliniques</label>
        <textarea name="observations" value={formData.observations} onChange={handleChange}
          rows={3} placeholder="Observations supplementaires..." className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date de suivi</label>
          <input type="date" name="date_prochain_rdv" value={formData.date_prochain_rdv} onChange={handleChange}
            className={inputClass} />
        </div>
        <div className="space-y-2">
          <label className={`font-medium text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Priorite medicale</label>
          <select name="priorite" value={formData.priorite} onChange={handleChange} className={inputClass}>
            <option value="normal">Normal</option>
            <option value="moyen">Moyen</option>
            <option value="eleve">Eleve</option>
            <option value="urgence">Urgence</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
        <button onClick={() => setIsNewConsultation(false)}
          className={`px-4 py-2 rounded-xl text-sm ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
          Annuler
        </button>
        <button onClick={handleSubmit} disabled={saving}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
          <Save size={16} />
          {saving ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}