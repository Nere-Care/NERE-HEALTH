import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { post, put } from "../../../services/apiClient";
import PosologieBuilder from "../../PosologieBuilder";
import MedicamentSearch from "../../MedicamentSearch";
import LabSearch from "../../LabSearch";
import { FORMES } from "../../../constants/medicalOptions";

const EMPTY_LIGNE = { medicament_nom: "", dosage: "", forme: "comprimes", posologie: "", duree_jours: 7, quantite: 1, posologieConfig: null };

export default function NewConsultationForm({
  selectedPatient,
  setIsNewConsultation,
  rdvId,
  patientId,
}) {
  const [saving, setSaving] = useState(false);
  const [motif, setMotif] = useState("");
  const [examenClinique, setExamenClinique] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const [planTraitement, setPlanTraitement] = useState("");
  const [lignes, setLignes] = useState([{ ...EMPTY_LIGNE }]);
  const [labAnalyses, setLabAnalyses] = useState([]);
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saved, setSaved] = useState(false);

  const addLigne = () => setLignes((l) => [...l, { ...EMPTY_LIGNE }]);
  const removeLigne = (idx) => setLignes((l) => l.filter((_, i) => i !== idx));
  const updateLigne = (idx, field, val) =>
    setLignes((l) => l.map((item, i) => (i === idx ? { ...item, [field]: val } : item)));

  const handleSave = async () => {
    if (!rdvId || !patientId) {
      console.log("Pas de RDV lie -- impossible de sauvegarder la consultation");
      return;
    }
    setSaving(true);
    try {
      const prescriptionText = lignes
        .filter((l) => l.medicament_nom || l.posologie)
        .map((l) => {
          const parts = [];
          if (l.medicament_nom) parts.push(l.medicament_nom);
          if (l.dosage) parts.push(l.dosage);
          if (l.forme) parts.push(`(${l.forme})`);
          if (l.posologie) parts.push(l.posologie);
          return parts.join(" ");
        })
        .join("\n");

      await post("/api/consultations", {
        rdv_id: rdvId,
        patient_id: patientId,
        motif: motif || "Consultation generale",
        examen_clinique: examenClinique || null,
        diagnostic_principal: diagnostic || null,
        plan_traitement: planTraitement || null,
        prescription_posologie: prescriptionText || null,
        demandes_labo: labAnalyses.length > 0 ? labAnalyses.map((a) => a.nom).join(", ") : null,
        observations: notes || null,
        statut: "en_cours",
      });
      try {
        await put(`/api/rendez_vous/${rdvId}/complete`);
      } catch (e) {
        console.error("Erreur finalisation RDV:", e);
      }
      setSaved(true);
      setTimeout(() => {
        setIsNewConsultation(false);
      }, 1500);
    } catch (err) {
      console.error("Erreur sauvegarde consultation:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "border p-3 rounded-xl w-full";

  return (
    <div className="mt-6 p-5 border rounded-2xl bg-white space-y-6">

      <h3 className="font-semibold text-lg">
        New Clinical Consultation
      </h3>

      {/* PATIENT CONTEXT */}
      <div className="p-3 border rounded-xl bg-gray-50 text-sm">
        <p className="font-medium">Patient Context</p>
        <p>
          {selectedPatient?.name} — {selectedPatient?.patientId}
        </p>
        <p className="text-gray-500">
          Age: {selectedPatient?.age} • Gender: {selectedPatient?.gender}
        </p>
      </div>

      {/* CHIEF COMPLAINT */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Chief Complaint</label>
        <input
          type="text"
          placeholder="Main reason for consultation"
          className={inputClass}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
      </div>

      {/* CLINICAL EXAM */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Clinical Examination</label>
        <textarea
          rows={3}
          placeholder="Physical examination findings..."
          className={inputClass}
          value={examenClinique}
          onChange={(e) => setExamenClinique(e.target.value)}
        />
      </div>

      {/* DIAGNOSIS + TREATMENT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-medium text-sm">Diagnosis</label>
          <input
            type="text"
            className={inputClass}
            value={diagnostic}
            onChange={(e) => setDiagnostic(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium text-sm">Treatment Plan</label>
          <input
            type="text"
            className={inputClass}
            value={planTraitement}
            onChange={(e) => setPlanTraitement(e.target.value)}
          />
        </div>
      </div>

      {/* PRESCRIPTION - Multi-medication cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-medium text-sm">Prescription</label>
          <button onClick={addLigne} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            <Plus size={12} /> Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {lignes.map((ligne, idx) => (
            <div key={idx} className="p-3 rounded-lg border bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">Medicament {idx + 1}</span>
                {lignes.length > 1 && (
                  <button onClick={() => removeLigne(idx)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <MedicamentSearch
                  value={ligne.medicament_nom}
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
                  className="px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-gray-50 border-gray-200 text-gray-900"
                />
                <select
                  value={ligne.forme}
                  onChange={(e) => updateLigne(idx, "forme", e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-gray-50 border-gray-200 text-gray-900"
                >
                  {FORMES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <div>
                  <label className="text-[10px] font-medium mb-0.5 block text-gray-500">Nb boites/Flacons</label>
                  <input
                    type="number"
                    min="1"
                    value={ligne.quantite}
                    onChange={(e) => updateLigne(idx, "quantite", e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none bg-gray-50 border-gray-200 text-gray-900"
                  />
                </div>
              </div>
              <div className="mt-2">
                <PosologieBuilder
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

      {/* LAB REQUESTS */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Laboratory Requests</label>
        <LabSearch
          allowCustom
          onSelect={(analyse) => {
            if (!labAnalyses.find((a) => a.nom === analyse.nom)) {
              setLabAnalyses([...labAnalyses, analyse]);
            }
          }}
          placeholder="Rechercher une analyse..."
        />
        {labAnalyses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {labAnalyses.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700"
              >
                {a.nom}
                <button
                  type="button"
                  onClick={() => setLabAnalyses(labAnalyses.filter((_, j) => j !== i))}
                  className="ml-0.5 hover:text-red-500"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* NOTES */}
      <div className="space-y-2">
        <label className="font-medium text-sm">Clinical Notes</label>
        <textarea
          rows={4}
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* FOLLOW UP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-medium text-sm">Follow-up Date</label>
          <input
            type="date"
            className={inputClass}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="font-medium text-sm">Medical Priority</label>
          <select className={inputClass}>
            <option>Normal</option>
            <option>Medium</option>
            <option>High</option>
            <option>Emergency</option>
          </select>
        </div>
      </div>

      {/* FILE UPLOAD */}
      <div className="border rounded-xl p-3">
        <p className="text-sm font-medium mb-2">
          Attach Medical Documents
        </p>
        <input type="file" multiple />
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <button
          onClick={() => setIsNewConsultation(false)}
          className="px-4 py-2 rounded-xl bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Consultation"}
        </button>
      </div>

    </div>
  );
}
