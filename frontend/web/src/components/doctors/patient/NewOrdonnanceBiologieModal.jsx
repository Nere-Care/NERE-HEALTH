import { useState } from "react";
import { FlaskConical, Trash2, CheckCircle, Loader } from "lucide-react";
import { post } from "../../../services/apiClient";
import Modal from "../../common/Modal";
import LabSearch from "../../LabSearch";

export default function NewOrdonnanceBiologieModal({
  patientId,
  patientName,
  medecinId,
  consultations = [],
  darkMode,
  onClose,
  onCreated,
}) {
  const [selectedExamens, setSelectedExamens] = useState([]);
  const [consultationId, setConsultationId] = useState("");
  const [motif, setMotif] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const addExamen = (analyse) => {
    if (!selectedExamens.find((e) => e.nom === analyse.nom)) {
      setSelectedExamens((prev) => [...prev, analyse]);
    }
  };

  const removeExamen = (nom) => {
    setSelectedExamens((prev) => prev.filter((e) => e.nom !== nom));
  };

  const handleSubmit = async () => {
    if (selectedExamens.length === 0) {
      setError("Veuillez selectionner au moins un examen");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await post("/api/ordonnances", {
        numero: `BIO-${Date.now().toString(36).toUpperCase()}`,
        consultation_id: consultationId || undefined,
        patient_id: patientId,
        medecin_id: medecinId || undefined,
        type_consultation: "biologie",
        type_ordonnance: "biologie",
        motif: motif || "Demande d'examens biologiques",
        qr_code_data: `ordonnance-biologie-${Date.now()}`,
        notes_medecin: notes || undefined,
        date_expiration: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        lignes: selectedExamens.map((examen, idx) => ({
          medicament_nom: examen.nom,
          dosage: examen.categorie || "N/A",
          forme: "autre",
          posologie: "Examen biologique",
          duree_jours: 1,
          quantite: 1,
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
      <Modal open={true} onClose={onClose} title="Ordonnance biologie" darkMode={darkMode} size="max-w-md">
        <div className="flex flex-col items-center py-6 gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
            Ordonnance creee avec succes
          </p>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {selectedExamens.length} examen(s) prescrit(s)
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title="Nouvelle ordonnance biologie" darkMode={darkMode} size="max-w-lg">
      <div className="space-y-4">
        <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-purple-50"}`}>
          <FlaskConical className="w-5 h-5 text-purple-500" />
          <div>
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
              Patient : {patientName}
            </p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Ordonnance d'examens biologiques
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
              className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200 text-gray-800"
              }`}
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
              placeholder="Ex: Bilan pre-operatoire"
              className={`w-full px-3 py-2 rounded-xl text-sm border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Examens a prescrire
          </label>
          <LabSearch
            darkMode={darkMode}
            allowCustom
            onSelect={addExamen}
            placeholder="Rechercher un examen biologique..."
          />
        </div>

        {selectedExamens.length > 0 && (
          <div>
            <p className={`text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Examens selectionnes ({selectedExamens.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedExamens.map((examen) => (
                <span
                  key={examen.nom}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    darkMode ? "bg-purple-900/40 text-purple-300" : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {examen.nom}
                  <button onClick={() => removeExamen(examen.nom)} className="ml-0.5 hover:text-purple-900">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Notes du medecin
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Instructions particulieres, contexte clinique..."
            className={`w-full px-3 py-2 rounded-xl text-sm border resize-none ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
            }`}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

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
            disabled={saving || selectedExamens.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm hover:bg-purple-700 transition disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            {saving ? "Creation..." : "Creer l'ordonnance"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
