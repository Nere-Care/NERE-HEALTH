import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Loader, Clock, Paperclip, AlertCircle } from "lucide-react";
import { get, post } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

export default function DemandeAvisModal({ darkMode, onClose }) {
  const [specialites, setSpecialites] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [specialiteId, setSpecialiteId] = useState("");
  const [portee, setPortee] = useState("cameroun");
  const [patientId, setPatientId] = useState("");
  const [consultationId, setConsultationId] = useState("");
  const [dossierId, setDossierId] = useState("");
  const [motif, setMotif] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [contexte, setContexte] = useState("");
  const [question, setQuestion] = useState("");
  const [examens, setExamens] = useState("");
  const [message, setMessage] = useState("");
  const [confidentiel, setConfidentiel] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const urgences = [
    { value: "non_urgent", label: "Non urgent", color: "bg-gray-100 text-gray-700 border-gray-300", active: "bg-gray-200 border-gray-500" },
    { value: "normal", label: "Sous 48h", color: "bg-blue-50 text-blue-700 border-blue-300", active: "bg-blue-100 border-blue-500" },
    { value: "urgent", label: "Urgent", color: "bg-orange-50 text-orange-700 border-orange-300", active: "bg-orange-100 border-orange-500" },
    { value: "tres_urgent", label: "Très urgent", color: "bg-red-50 text-red-700 border-red-300", active: "bg-red-100 border-red-500" },
  ];

  useEffect(() => {
    Promise.all([
      get("/api/specialites").catch(() => []),
      get("/api/patients", { mine: true, limit: 200 }).catch(() => []),
    ]).then(([specs, pats]) => {
      setSpecialites(specs);
      setPatients(pats);
    }).finally(() => setLoading(false));
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

  const validate = () => {
    const e = {};
    if (!specialiteId) e.specialiteId = "La spécialité est requise";
    if (!patientId) e.patientId = "Le patient est requis";
    if (!motif.trim()) e.motif = "Le motif est requis";
    if (!contexte.trim()) e.contexte = "Le contexte clinique est requis";
    if (!question.trim()) e.question = "La question clinique est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await post("/api/demandes-avis", {
        specialite_id: specialiteId,
        patient_id: patientId,
        portee,
        consultation_id: consultationId || null,
        dossier_medical_id: dossierId || null,
        motif: motif.trim(),
        message: [
          `Urgence: ${urgence}`,
          `Contexte: ${contexte.trim()}`,
          `Question: ${question.trim()}`,
          examens.trim() ? `Examens: ${examens.trim()}` : null,
          message.trim() || null,
        ].filter(Boolean).join("\n\n"),
        confidentiel,
      });
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border outline-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500" : "bg-gray-50 border-gray-200 focus:border-blue-500");

  const textareaClass = "w-full p-3 rounded-xl border outline-none resize-none transition " +
    (darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500" : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500");

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto z-[9999] p-4 sm:p-6 md:p-10">
      <div className={(darkMode ? "w-full max-w-2xl my-auto rounded-2xl shadow-2xl bg-gray-900 text-white" : "w-full max-w-2xl my-auto rounded-2xl shadow-2xl bg-white text-gray-800")}>

        {/* HEADER */}
        <div className={(darkMode ? "sticky top-0 z-10 flex items-start justify-between p-5 border-b bg-gray-900 border-gray-700" : "sticky top-0 z-10 flex items-start justify-between p-5 border-b bg-white border-gray-100")}>
          <div>
            <h2 className="text-lg font-bold">Demander un avis médical</h2>
            <p className={(darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500")}>
              La demande sera envoyée aux médecins de la spécialité choisie
            </p>
          </div>
          <button onClick={onClose} className={(darkMode ? "p-2 rounded-lg transition hover:bg-gray-700" : "p-2 rounded-lg transition hover:bg-gray-100")}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader size={24} className="animate-spin text-blue-500" />
          </div>
        ) : success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Send size={28} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Demande envoyée</h3>
            <p className={(darkMode ? "text-sm text-gray-400" : "text-sm text-gray-500")}>
              Les médecins concernés ont été notifiés.
            </p>
            <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
              Fermer
            </button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-5">

            {errors.submit && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{errors.submit}</div>
            )}

            {/* SPECIALITE */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Spécialité recherchée <span className="text-red-500">*</span>
              </label>
              <select value={specialiteId} onChange={(e) => setSpecialiteId(e.target.value)}
                className={inputClass + (errors.specialiteId ? " border-red-500" : "")}>
                <option value="">— Sélectionnez une spécialité —</option>
                {specialites.map((s) => (
                  <option key={s.id} value={s.id}>{s.libelle_fr}</option>
                ))}
              </select>
              {errors.specialiteId && <p className="text-xs text-red-500 mt-1">{errors.specialiteId}</p>}
            </div>

            {/* PORTEE */}
            <div>
              <label className="text-sm font-semibold mb-2 block">Périmètre géographique</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "cameroun", label: "Cameroun" },
                  { value: "diaspora", label: "Diaspora" },
                ].map((p) => (
                  <button key={p.value} type="button" onClick={() => setPortee(p.value)}
                    className={"px-4 py-3 rounded-xl text-sm font-semibold border-2 transition " +
                      (portee === p.value
                        ? "bg-blue-100 border-blue-500 text-blue-700"
                        : (darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"))}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PATIENT */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Patient concerné <span className="text-red-500">*</span>
              </label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
                className={inputClass + (errors.patientId ? " border-red-500" : "")}>
                <option value="">— Sélectionnez un patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
              {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>}
            </div>

            {/* CONSULTATION */}
            {patientId && consultations.length > 0 && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Consultation liée
                  <span className={darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500"}>(optionnel)</span>
                </label>
                <select value={consultationId} onChange={(e) => setConsultationId(e.target.value)} className={inputClass}>
                  <option value="">— Aucune consultation —</option>
                  {consultations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero_consultation || c.id?.slice(0, 8)} — {new Date(c.created_at).toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })}
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
                  <span className={darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500"}>(optionnel)</span>
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
              <select value={motif} onChange={(e) => setMotif(e.target.value)}
                className={inputClass + (errors.motif ? " border-red-500" : "")}>
                <option value="">— Sélectionnez un motif —</option>
                <option value="Confirmation diagnostique">Confirmation diagnostique</option>
                <option value="Aide à la décision thérapeutique">Aide à la décision thérapeutique</option>
                <option value="Interprétation d'examens complémentaires">Interprétation d'examens complémentaires</option>
                <option value="Deuxième avis médical">Deuxième avis médical</option>
                <option value="Avis spécialisé pluridisciplinaire">Avis spécialisé pluridisciplinaire</option>
                <option value="Suivi de pathologie complexe">Suivi de pathologie complexe</option>
                <option value="Autre">Autre</option>
              </select>
              {errors.motif && <p className="text-xs text-red-500 mt-1">{errors.motif}</p>}
            </div>

            {/* URGENCE */}
            <div>
              <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Clock size={14} />
                Niveau d'urgence
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {urgences.map((u) => (
                  <button key={u.value} type="button" onClick={() => setUrgence(u.value)}
                    className={"px-3 py-2 rounded-xl text-xs font-semibold border-2 transition " +
                    (urgence === u.value ? u.active : u.color)}>
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
              <textarea value={contexte} onChange={(e) => setContexte(e.target.value)}
                placeholder="Âge du patient, antécédents, symptômes, diagnostic actuel, traitements en cours..."
                rows={4}
                className={textareaClass + (errors.contexte ? " border-red-500" : "")} />
              {errors.contexte && <p className="text-xs text-red-500 mt-1">{errors.contexte}</p>}
            </div>

            {/* QUESTION CLINIQUE */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Question clinique posée <span className="text-red-500">*</span>
              </label>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
                placeholder="Quelle est votre question précise pour votre confrère ?"
                rows={3}
                className={textareaClass + (errors.question ? " border-red-500" : "")} />
              {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
            </div>

            {/* EXAMENS */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Examens / investigations déjà réalisés
                <span className={"text-xs font-normal ml-2 " + (darkMode ? "text-gray-400" : "text-gray-500")}>(optionnel)</span>
              </label>
              <textarea value={examens} onChange={(e) => setExamens(e.target.value)}
                placeholder="Biologie, imagerie, ECG, etc."
                rows={2}
                className={textareaClass} />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Message complémentaire
                <span className={darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500"}>(optionnel)</span>
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                placeholder="Informations supplémentaires pour les médecins consultés..."
                rows={3}
                className={textareaClass} />
            </div>

            {/* PIECES JOINTES */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Pièces jointes
                <span className={darkMode ? "text-xs font-normal ml-2 text-gray-400" : "text-xs font-normal ml-2 text-gray-500"}>(optionnel — ordonnances, résultats, imagerie)</span>
              </label>
              <label className={(darkMode ? "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition border-gray-700 hover:border-gray-600 text-gray-400" : "flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition border-gray-300 hover:border-blue-400 text-gray-500")}>
                <Paperclip size={18} />
                <span className="text-sm">Cliquez pour ajouter des documents</span>
                <input type="file" multiple className="hidden" />
              </label>
            </div>

            {/* CONFIDENTIEL */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={confidentiel} onChange={(e) => setConfidentiel(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm">Demande confidentielle</span>
            </label>

          </div>
        )}

        {/* FOOTER */}
        {!loading && !success && (
          <div className={(darkMode ? "sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t bg-gray-900 border-gray-700" : "sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t bg-white border-gray-100")}>
            <button onClick={onClose}
              className={(darkMode ? "px-5 py-2.5 rounded-xl text-sm font-semibold transition text-gray-300 hover:bg-gray-700" : "px-5 py-2.5 rounded-xl text-sm font-semibold transition text-gray-600 hover:bg-gray-100")}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
              {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              Envoyer la demande
            </button>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
