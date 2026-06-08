import { X, Stethoscope, AlertCircle, Paperclip, Clock } from "lucide-react";
import { useState } from "react";

export default function AskOpinionModal({
  darkMode,
  doctor,
  onClose,
  onSend,
}) {
  const [motif, setMotif] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [contexte, setContexte] = useState("");
  const [question, setQuestion] = useState("");
  const [examens, setExamens] = useState("");
  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!motif) newErrors.motif = "Veuillez sélectionner un motif";
    if (!contexte.trim()) newErrors.contexte = "Le contexte clinique est requis";
    if (!question.trim()) newErrors.question = "Veuillez formuler votre question";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSend({
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpeciality: doctor.speciality,
      motif,
      urgence,
      contexte,
      question,
      examens,
      date: new Date().toISOString(),
      statut: "en_attente", // en_attente | acceptee | refusee
    });

    // Reset
    setMotif("");
    setUrgence("normal");
    setContexte("");
    setQuestion("");
    setExamens("");
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
      >
        {/* HEADER */}
        <div
          className={`sticky top-0 z-10 flex items-start justify-between p-5 border-b
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}
        >
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {doctor.name?.charAt(0) || "D"}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                Demande d'avis médical
              </h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Adressée au <span className="font-semibold">{doctor.name}</span>
                {doctor.speciality && <> — {doctor.speciality}</>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition
            ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col gap-5">

          {/* INFO */}
          <div
            className={`flex items-start gap-3 p-3 rounded-xl text-xs
            ${darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              Votre demande sera envoyée sous forme de notification. Le praticien pourra
              l'accepter ou la refuser. Vous serez informé de sa décision.
            </p>
          </div>

          {/* MOTIF */}
          <div>
            <label className={`text-sm font-semibold mb-2 block`}>
              Motif de la demande <span className="text-red-500">*</span>
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500"
                : "bg-gray-50 border-gray-200 focus:border-blue-500"}
              ${errors.motif ? "border-red-500" : ""}`}
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
            <label className={`text-sm font-semibold mb-2 flex items-center gap-2`}>
              <Clock size={14} />
              Niveau d'urgence
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {urgences.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgence(u.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition
                  ${urgence === u.value
                    ? u.active
                    : u.color
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTEXTE CLINIQUE */}
          <div>
            <label className={`text-sm font-semibold mb-2 block`}>
              Contexte clinique <span className="text-red-500">*</span>
            </label>
            <textarea
              value={contexte}
              onChange={(e) => setContexte(e.target.value)}
              placeholder="Âge du patient, antécédents, symptômes, diagnostic actuel, traitements en cours..."
              rows={4}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500"}
              ${errors.contexte ? "border-red-500" : ""}`}
            />
            {errors.contexte && (
              <p className="text-xs text-red-500 mt-1">{errors.contexte}</p>
            )}
          </div>

          {/* QUESTION CLINIQUE */}
          <div>
            <label className={`text-sm font-semibold mb-2 block`}>
              Question clinique posée <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Quelle est votre question précise pour votre confrère ?"
              rows={3}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500"}
              ${errors.question ? "border-red-500" : ""}`}
            />
            {errors.question && (
              <p className="text-xs text-red-500 mt-1">{errors.question}</p>
            )}
          </div>

          {/* EXAMENS DÉJÀ RÉALISÉS */}
          <div>
            <label className={`text-sm font-semibold mb-2 block`}>
              Examens / investigations déjà réalisés
              <span className={`text-xs font-normal ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                (optionnel)
              </span>
            </label>
            <textarea
              value={examens}
              onChange={(e) => setExamens(e.target.value)}
              placeholder="Biologie, imagerie, ECG, etc."
              rows={2}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition
              ${darkMode
                ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500"
                : "bg-gray-50 border-gray-200 placeholder-gray-400 focus:border-blue-500"}`}
            />
          </div>

          {/* PIÈCES JOINTES */}
          <div>
            <label className={`text-sm font-semibold mb-2 block`}>
              Pièces jointes
              <span className={`text-xs font-normal ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                (optionnel — ordonnances, résultats, imagerie)
              </span>
            </label>
            <label
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition
              ${darkMode
                ? "border-gray-700 hover:border-gray-600 text-gray-400"
                : "border-gray-300 hover:border-blue-400 text-gray-500"}`}
            >
              <Paperclip size={18} />
              <span className="text-sm">Cliquez pour ajouter des documents</span>
              <input type="file" multiple className="hidden" />
            </label>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className={`sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}
        >
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition
            ${darkMode
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-600 hover:bg-gray-100"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Stethoscope size={16} />
            Envoyer la demande
          </button>
        </div>
      </div>
    </div>
  );
}