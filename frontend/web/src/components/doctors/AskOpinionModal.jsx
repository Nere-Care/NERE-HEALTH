import { X, Stethoscope, AlertCircle, Paperclip, Clock, Loader, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { get, post } from "../../services/apiClient";

export default function AskOpinionModal({
  darkMode,
  doctor,
  onClose,
}) {
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [motif, setMotif] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [contexte, setContexte] = useState("");
  const [question, setQuestion] = useState("");
  const [examens, setExamens] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    get("/api/patients").then(setPatients).catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientId) {
      setConsultations([]);
      setDossiers([]);
      setConsultationId("");
      setDossierId("");
      return;
    }
    Promise.all([
      get("/api/consultations", { patient_id: patientId }).catch(() => []),
      get("/api/dossiers_medicaux", { patient_id: patientId }).catch(() => []),
    ]).then(([cons, doss]) => {
      setConsultations(cons);
      setDossiers(doss);
      setConsultationId("");
      setDossierId("");
    });
  }, [patientId]);

  if (!doctor) return null;

  const motifs = [
    "Confirmation diagnostique",
    "Aide à la décision thérapeutique",
    "Interprétation d'examens complémentaires",
    "Deuxième avis médical",
    "Avis spécialisé pluridisciplinaire",
    "Suivi de pathologie complexe",
    "Autre",
  ];

  const urgences = [
    { value: "non_urgent", label: "Non urgent", color: "bg-gray-100 text-gray-700 border-gray-300", active: "bg-gray-200 border-gray-500" },
    { value: "normal", label: "Sous 48h", color: "bg-blue-50 text-blue-700 border-blue-300", active: "bg-blue-100 border-blue-500" },
    { value: "urgent", label: "Urgent", color: "bg-orange-50 text-orange-700 border-orange-300", active: "bg-orange-100 border-orange-500" },
    { value: "tres_urgent", label: "Très urgent", color: "bg-red-50 text-red-700 border-red-300", active: "bg-red-100 border-red-500" },
  ];

  const inputClass = "w-full px-4 py-2.5 rounded-xl border outline-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500");

  const textareaClass = "w-full p-3 rounded-xl border outline-none resize-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500" : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500");

  const validate = () => {
    const newErrors = {};
    if (!patientId) newErrors.patientId = "Le patient est requis";
    if (!motif) newErrors.motif = "Veuillez sélectionner un motif";
    if (!contexte.trim()) newErrors.contexte = "Le contexte clinique est requis";
    if (!question.trim()) newErrors.question = "Veuillez formuler votre question";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await post("/api/demandes-avis", {
        patient_id: patientId,
        specialite_id: doctor.specialiteId,
        portee: "cameroun",
        consultation_id: consultationId || null,
        dossier_medical_id: dossierId || null,
        motif,
        message: [
          `Urgence: ${urgence}`,
          `Contexte: ${contexte.trim()}`,
          `Question: ${question.trim()}`,
          examens.trim() ? `Examens: ${examens.trim()}` : null,
        ].filter(Boolean).join("\n\n"),
        confidentiel: true,
        medecin_cible_id: doctor.id,
      });
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto z-[9999] p-4 sm:p-6 md:p-10">
      <div
        className={(darkMode ? "w-full max-w-2xl my-auto rounded-2xl shadow-2xl relative bg-gray-900 text-white" : "w-full max-w-2xl my-auto rounded-2xl shadow-2xl relative bg-white text-gray-800")}
      >
        {/* HEADER */}
        <div
          className={(darkMode ? "sticky top-0 z-10 flex items-start justify-between p-5 border-b bg-gray-900 border-gray-700" : "sticky top-0 z-10 flex items-start justify-between p-5 border-b bg-white border-gray-100")}
        >
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {doctor.name?.charAt(0) || "D"}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Demande d'avis médical
              </h2>
              <p className={(darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500")}>
                Adressée au <span className="font-semibold">{doctor.name}</span>
                {doctor.speciality && <> — {doctor.speciality}</>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={(darkMode ? "p-2 rounded-lg transition hover:bg-gray-700" : "p-2 rounded-lg transition hover:bg-gray-100")}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Demande envoyée</h3>
            <p className={(darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500")}>
              Dr. {doctor.name} a été notifié.
            </p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
              Fermer
            </button>
          </div>
        ) : (
        <div className="p-5 flex flex-col gap-5">

          {/* INFO */}
          <div
            className={(darkMode ? "flex items-start gap-3 p-3 rounded-xl text-xs bg-blue-900/30 text-blue-300" : "flex items-start gap-3 p-3 rounded-xl text-xs bg-blue-50 text-blue-700")}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              Votre demande sera envoyée sous forme de notification. Le praticien pourra
              l'accepter ou la refuser. Vous serez informé de sa décision.
            </p>
          </div>

          {/* PATIENT */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Patient concerné <span className="text-red-500">*</span>
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className={inputClass + (errors.patientId ? " border-red-500" : "")}
            >
              <option value="">— Sélectionnez un patient —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>
            )}
          </div>

          {/* CONSULTATION */}
          {patientId && consultations.length > 0 && (
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Consultation liée
                <span className={(darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500")}>(optionnel)</span>
              </label>
              <select value={consultationId} onChange={(e) => setConsultationId(e.target.value)} className={inputClass}>
                <option value="">— Aucune consultation —</option>
                {consultations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero_consultation || c.id?.slice(0, 8)} — {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DOSSIER MEDICAL */}
          {patientId && dossiers.length > 0 && (
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Dossier médical
                <span className={(darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500")}>(optionnel)</span>
              </label>
              <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} className={inputClass}>
                <option value="">— Aucun dossier —</option>
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dossier {d.numero_dossier || d.id?.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* MOTIF */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Motif de la demande <span className="text-red-500">*</span>
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={inputClass + (errors.motif ? " border-red-500" : "")}
            >
              <option value="">— Sélectionnez un motif —</option>
              {motifs.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {errors.motif && (
              <p className="text-xs text-red-500 mt-1">{errors.motif}</p>
            )}
          </div>

          {/* URGENCE */}
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock size={14} />
              Niveau d'urgence
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {urgences.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgence(u.value)}
                  className={"px-3 py-2 rounded-xl text-xs font-semibold border-2 transition " + (urgence === u.value ? u.active : u.color)}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTEXTE CLINIQUE */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Contexte clinique <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              placeholder="Âge du patient, antécédents, symptômes, diagnostic actuel, traitements en cours..."
              rows={4}
              className={textareaClass + (errors.contexte ? " border-red-500" : "")}
            />
            {errors.contexte && (
              <p className="text-xs text-red-500 mt-1">{errors.contexte}</p>
            )}
          </div>

          {/* QUESTION CLINIQUE */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Question clinique posée <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Quelle est votre question précise pour votre confrère ?"
              rows={3}
              className={textareaClass + (errors.question ? " border-red-500" : "")}
            />
            {errors.question && (
              <p className="text-xs text-red-500 mt-1">{errors.question}</p>
            )}
          </div>

          {/* EXAMENS DÉJÀ RÉALISÉS */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Examens / investigations déjà réalisés
              <span className={(darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500")}>
                (optionnel)
              </span>
            </label>
            <textarea
              value={examens}
              onChange={(e) => setExamens(e.target.value)}
              placeholder="Biologie, imagerie, ECG, etc."
              rows={2}
              className={textareaClass}
            />
          </div>

          {/* PIÈCES JOINTES */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Pièces jointes
              <span className={(darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500")}>
                (optionnel — ordonnances, résultats, imagerie)
              </span>
            </label>
            <label
className={(darkMode ? "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition border-gray-700 hover:border-gray-600 text-gray-400" : "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition border-gray-300 hover:border-blue-400 text-gray-500")}
            >
              <Paperclip size={18} />
              <span className="text-sm">Cliquez pour ajouter des documents</span>
              <input type="file" multiple className="hidden" />
            </label>
           </div>
        </div>
        )}
        {/* FOOTER */}
        {!success && (
        <div
          className={(darkMode ? "sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t bg-gray-900 border-gray-700" : "sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t bg-white border-gray-100")}
        >
          {errors.submit && (
            <p className="text-xs text-red-500 mr-auto">{errors.submit}</p>
          )}
          <button
            onClick={onClose}
className={(darkMode ? "px-5 py-2.5 rounded-xl text-sm font-semibold transition text-gray-300 hover:bg-gray-700" : "px-5 py-2.5 rounded-xl text-sm font-semibold transition text-gray-600 hover:bg-gray-100")}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader size={16} className="animate-spin" /> : <Stethoscope size={16} />}
            Envoyer la demande
          </button>
        </div>
        )}
      </div>
    </div>,
    document.body
  );
}