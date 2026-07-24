import { useState } from "react";
import { Pill, Plus, Trash2, CheckCircle, Loader } from "lucide-react";
import { post } from "../../../services/apiClient";
import Modal from "../../common/Modal";
import MedicamentSearch from "../../MedicamentSearch";
import PosologieBuilder from "../../PosologieBuilder";
import { FORMES } from "../../../constants/medicalOptions";

const EMPTY_LIGNE = {
  medicament_nom: "",
  dosage: "",
  forme: "comprimes",
  posologie: "",
  duree_jours: 7,
  quantite: 1,
  posologieConfig: null,
};

export default function NewOrdonnanceMedicamentModal({
  patientId,
  patientName,
  medecinId,
  consultations = [],
  darkMode,
  onClose,
  onCreated,
}) {
  const [consultationId, setConsultationId] = useState("");
  const [motif, setMotif] = useState("");
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const addLigne = () => setLignes((l) => [...l, { ...EMPTY_LIGNE }]);
  const removeLigne = (idx) => setLignes((l) => l.filter((_, i) => i !== idx));
  const updateLigne = (idx, field, val) =>
    setLignes((l) => l.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const handleSubmit = async () => {
    const validLignes = lignes.filter((l) => l.medicament_nom || l.posologie);
    if (validLignes.length === 0) {
      setError("Veuillez ajouter au moins un medicament");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const now = new Date();
      await post("/api/ordonnances", {
        numero: `ORD-${Date.now().toString(36).toUpperCase()}`,
        consultation_id: consultationId || undefined,
        medecin_id: medecinId || undefined,
        patient_id: patientId,
        motif: motif || "Prescription de medicaments",
        type_consultation: "clinique",
        type_ordonnance: "medicament",
        qr_code_data: `ordonnance-${Date.now()}`,
        notes_medecin: notes || undefined,
        date_expiration: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        lignes: validLignes.map((l, idx) => ({
          medicament_nom: l.medicament_nom,
          dosage: l.dosage || "N/A",
          forme: l.forme || "comprimes",
          posologie: l.posologie || "",
          duree_jours: Number(l.duree_jours) || 7,
          quantite: Number(l.quantite) || 1,
          ordre: idx + 1,
        })),
      });
      setSuccess(true);
      setTimeout(() => {
        onCreated?.();
        onClose();
      }, 1500);
    } catch (e) {
      setError(e?.response?.data?.detail || "Erreur lors de la creation de l'ordonnance");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <Modal open={true} onClose={onClose} title="Ordonnance medicaments" darkMode={darkMode} size="max-w-md">
        <div className="flex flex-col items-center py-6 gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
            Ordonnance creee avec succes
          </p>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {lignes.filter((l) => l.medicament_nom).length} medicament(s) prescrit(s)
          </p>
        </div>
      </Modal>
    );
  }

  const selectClass = `w-full px-3 py-2 rounded-xl text-sm border outline-none ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-white border-gray-200 text-gray-800"
  }`;

  return (
    <Modal open={true} onClose={onClose} title="Nouvelle ordonnance medicaments" darkMode={darkMode} size="max-w-2xl">
      <div className="space-y-4">
        <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
          <Pill className="w-5 h-5 text-blue-500" />
          <div>
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
              Patient : {patientName}
            </p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Ordonnance de medicaments
            </p>
          </div>
        </div>

        {/* Consultation + Motif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Consultation
            </label>
            <select
              value={consultationId}
              onChange={(e) => setConsultationId(e.target.value)}
              className={selectClass}
            >
              <option value="">Selectionner une consultation</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.date || c.created_at?.slice(0, 10)} — {c.motif || c.reason || "Sans motif"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Motif
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Hypertension arterielle"
              className={`w-full px-3 py-2 rounded-xl text-sm border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        {/* Medicaments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Medicaments
            </label>
            <button onClick={addLigne} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {lignes.map((ligne, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                    Medicament {idx + 1}
                  </span>
                  {lignes.length > 1 && (
                    <button onClick={() => removeLigne(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <MedicamentSearch
                    value={ligne.medicament_nom}
                    darkMode={darkMode}
                    onSelect={(med) => {
                      updateLigne(idx, "medicament_nom", med.nom_commercial);
                      if (med.dosage) updateLigne(idx, "dosage", med.dosage);
                      if (med.forme) updateLigne(idx, "forme", med.forme);
                    }}
                    placeholder="Nom du medicament"
                  />
                  <input
                    placeholder="Dosage (ex: 500mg)"
                    value={ligne.dosage}
                    onChange={(e) => updateLigne(idx, "dosage", e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"}`}
                  />
                  <select
                    value={ligne.forme}
                    onChange={(e) => updateLigne(idx, "forme", e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                  >
                    {FORMES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div>
                    <label className={`text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Nb boites/Flacons
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(idx, "quantite", e.target.value)}
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <PosologieBuilder
                    darkMode={darkMode}
                    dureeJours={Number(ligne.duree_jours) || 7}
                    value={ligne.posologieConfig}
                    onChange={(config) => {
                      updateLigne(idx, "posologie", config.posologie);
                      updateLigne(idx, "posologieConfig", config);
                      if (config.dureeJours) updateLigne(idx, "duree_jours", config.dureeJours);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={`block text-xs font-medium mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Notes du medecin
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes du medecin..."
            className={`w-full px-3 py-2 rounded-xl text-sm border resize-none ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
            }`}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
            {saving ? "Creation..." : "Creer l'ordonnance"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
