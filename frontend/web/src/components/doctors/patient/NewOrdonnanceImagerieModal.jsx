import { useState } from "react";
import { ScanLine, Trash2, CheckCircle, Loader } from "lucide-react";
import { post } from "../../../services/apiClient";
import Modal from "../../common/Modal";
import { TYPES_IMAGERIE, ZONES_ANATOMIQUES } from "../../../constants/medicalOptions";

export default function NewOrdonnanceImagerieModal({
  patientId,
  patientName,
  medecinId,
  consultations = [],
  darkMode,
  onClose,
  onCreated,
}) {
  const [examens, setExamens] = useState([
    { type: "", zone: "", indication: "", contraste: false },
  ]);
  const [consultationId, setConsultationId] = useState("");
  const [motif, setMotif] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const addExamen = () =>
    setExamens((prev) => [...prev, { type: "", zone: "", indication: "", contraste: false }]);
  const removeExamen = (idx) => setExamens((prev) => prev.filter((_, i) => i !== idx));
  const updateExamen = (idx, field, val) =>
    setExamens((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: val } : e)));

  const handleSubmit = async () => {
    const valid = examens.filter((e) => e.type);
    if (valid.length === 0) {
      setError("Veuillez selectionner au moins un type d'imagerie");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const now = new Date();
      await post("/api/ordonnances", {
        numero: `IMG-${Date.now().toString(36).toUpperCase()}`,
        consultation_id: consultationId || undefined,
        medecin_id: medecinId || undefined,
        patient_id: patientId,
        motif: motif || "Demande d'imagerie medicale",
        type_consultation: "imagerie",
        type_ordonnance: "imagerie",
        qr_code_data: `ordonnance-imagerie-${Date.now()}`,
        notes_medecin: [
          notes || undefined,
          ...valid.map((e, idx) => {
            const typeLabel = TYPES_IMAGERIE.find((t) => t.value === e.type)?.label || e.type;
            const parts = [`${idx + 1}. ${typeLabel}`];
            if (e.zone) parts.push(`   Region : ${e.zone}`);
            if (e.indication) parts.push(`   Indication : ${e.indication}`);
            if (e.contraste) parts.push("   Avec injection de contraste");
            return parts.join("\n");
          }),
        ]
          .filter(Boolean)
          .join("\n"),
        date_expiration: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        lignes: valid.map((e, idx) => {
          const typeLabel = TYPES_IMAGERIE.find((t) => t.value === e.type)?.label || e.type;
          const details = [
            e.zone && `Region: ${e.zone}`,
            e.indication && `Indication: ${e.indication}`,
            e.contraste && "Avec contraste",
          ]
            .filter(Boolean)
            .join(" | ");
          return {
            medicament_nom: `${typeLabel}${details ? " — " + details : ""}`,
            dosage: e.type,
            forme: "imagerie",
            posologie: e.indication || "Examen d'imagerie",
            duree_jours: 1,
            quantite: 1,
            ordre: idx + 1,
          };
        }),
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
      <Modal open={true} onClose={onClose} title="Ordonnance imagerie" darkMode={darkMode} size="max-w-md">
        <div className="flex flex-col items-center py-6 gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
            Ordonnance creee avec succes
          </p>
          <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {examens.filter((e) => e.type).length} examen(s) d'imagerie prescrit(s)
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
    <Modal open={true} onClose={onClose} title="Nouvelle ordonnance imagerie" darkMode={darkMode} size="max-w-2xl">
      <div className="space-y-4">
        <div className={`flex items-center gap-2 p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-cyan-50"}`}>
          <ScanLine className="w-5 h-5 text-cyan-500" />
          <div>
            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
              Patient : {patientName}
            </p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Ordonnance d'imagerie medicale
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
              Motif general
            </label>
            <input
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex: Douleur lombaire chronique"
              className={`w-full px-3 py-2 rounded-xl text-sm border ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        {/* Examens */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Examens d'imagerie
            </label>
            <button onClick={addExamen} className="flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-600 font-medium">
              + Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {examens.map((examen, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                    Examen {idx + 1}
                  </span>
                  {examens.length > 1 && (
                    <button onClick={() => removeExamen(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Type d'imagerie
                    </label>
                    <select
                      value={examen.type}
                      onChange={(e) => updateExamen(idx, "type", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Choisir...</option>
                      {TYPES_IMAGERIE.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Region anatomique
                    </label>
                    <select
                      value={examen.zone}
                      onChange={(e) => updateExamen(idx, "zone", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Choisir une region...</option>
                      {ZONES_ANATOMIQUES.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <label className={`text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Indication clinique
                  </label>
                  <input
                    type="text"
                    value={examen.indication}
                    onChange={(e) => updateExamen(idx, "indication", e.target.value)}
                    placeholder="Ex: Suspicion de fracture, douleur persistante..."
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border ${
                      darkMode
                        ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                        : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <label className={`flex items-center gap-2 text-xs cursor-pointer ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    <input
                      type="checkbox"
                      checked={examen.contraste}
                      onChange={(e) => updateExamen(idx, "contraste", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Avec injection de contraste
                  </label>
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
            placeholder="Instructions particulieres, contexte clinique..."
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm hover:bg-cyan-700 transition disabled:opacity-50"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {saving ? "Creation..." : "Creer l'ordonnance"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
