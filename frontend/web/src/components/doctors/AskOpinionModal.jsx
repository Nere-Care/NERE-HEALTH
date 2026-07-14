import { X, Stethoscope, AlertCircle, Paperclip, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function AskOpinionModal({ darkMode, doctor, onClose, onSend }) {
  const [motif, setMotif] = useState("");
  const [urgence, setUrgence] = useState("normal");
  const [contexte, setContexte] = useState("");
  const [question, setQuestion] = useState("");
  const [examens, setExamens] = useState("");
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState(null);

  if (!doctor) return null;

  const motifs = [
    "Confirmation diagnostique",
    "Aide a la decision therapeutique",
    "Interpretation d'examens complementaires",
    "Deuxieme avis medical",
    "Avis specialise pluridisciplinaire",
    "Suivi de pathologie complexe",
    "Autre",
  ];

  const urgences = [
    { value: "non_urgent", label: "Non urgent",   color: "bg-gray-100 text-gray-700 border-gray-300",   active: "bg-gray-200 border-gray-500" },
    { value: "normal",     label: "Sous 48h",     color: "bg-blue-50 text-blue-700 border-blue-300",     active: "bg-blue-100 border-blue-500" },
    { value: "urgent",     label: "Urgent",       color: "bg-orange-50 text-orange-700 border-orange-300", active: "bg-orange-100 border-orange-500" },
    { value: "tres_urgent",label: "Tres urgent",  color: "bg-red-50 text-red-700 border-red-300",         active: "bg-red-100 border-red-500" },
  ];

  const validate = () => {
    const errs = {};
    if (!motif) errs.motif = "Veuillez selectionner un motif";
    if (!contexte.trim()) errs.contexte = "Le contexte clinique est requis";
    if (!question.trim()) errs.question = "Veuillez formuler votre question";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Convertit un fichier en base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    // Limite : 3 fichiers max, 5MB chacun
    const valides = selected.filter(f => f.size <= 5 * 1024 * 1024).slice(0, 3);
    setFiles(valides);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSending(true);
    setErreurEnvoi(null);
    try {
      // Encoder les fichiers en base64
      const fichiersEncodes = await Promise.all(
        files.map(async (f) => ({
          nom: f.name,
          type_mime: f.type,
          taille: f.size,
          contenu_base64: await fileToBase64(f),
        }))
      );

      await onSend({
        medecin_id: doctor.id,
        motif,
        urgence,
        contexte,
        question,
        examens,
        fichiers: fichiersEncodes,
      });

      setSuccess(true);
      // Fermer automatiquement après 2 secondes
      setTimeout(() => { onClose(); }, 2000);
    } catch (err) {
      setErreurEnvoi(err.message || "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h3 className="text-lg font-bold mb-2">Demande envoyee</h3>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Dr. {doctor.nom} recevra votre demande et pourra l'accepter ou la refuser.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl relative ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

        {/* HEADER */}
        <div className={`sticky top-0 z-10 flex items-start justify-between p-5 border-b ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {doctor.nom?.charAt(0) || "D"}
            </div>
            <div>
              <h2 className="text-lg font-bold">Demande d'avis medical</h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Adressee a <span className="font-semibold">{doctor.nom}</span>
                {doctor.specialite && <> — {doctor.specialite}</>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 flex flex-col gap-5">

          <div className={`flex items-start gap-3 p-3 rounded-xl text-xs ${darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>Votre demande sera envoyee sous forme de notification. Le praticien pourra l'accepter ou la refuser.</p>
          </div>

          {/* MOTIF */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Motif de la demande <span className="text-red-500">*</span>
            </label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border outline-none transition ${
                darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-50 border-gray-200"
              } ${errors.motif ? "border-red-500" : ""}`}
            >
              <option value="">— Selectionnez un motif —</option>
              {motifs.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.motif && <p className="text-xs text-red-500 mt-1">{errors.motif}</p>}
          </div>

          {/* URGENCE */}
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock size={14} /> Niveau d'urgence
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {urgences.map((u) => (
                <button key={u.value} type="button" onClick={() => setUrgence(u.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition ${urgence === u.value ? u.active : u.color}`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTEXTE */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Contexte clinique <span className="text-red-500">*</span>
            </label>
            <textarea value={contexte} onChange={(e) => setContexte(e.target.value)}
              placeholder="Age du patient, antecedents, symptomes, diagnostic actuel..." rows={4}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition ${
                darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200"
              } ${errors.contexte ? "border-red-500" : ""}`}
            />
            {errors.contexte && <p className="text-xs text-red-500 mt-1">{errors.contexte}</p>}
          </div>

          {/* QUESTION */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Question clinique <span className="text-red-500">*</span>
            </label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="Quelle est votre question precise pour votre confrere ?" rows={3}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition ${
                darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200"
              } ${errors.question ? "border-red-500" : ""}`}
            />
            {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
          </div>

          {/* EXAMENS */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Examens deja realises
              <span className={`text-xs font-normal ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>(optionnel)</span>
            </label>
            <textarea value={examens} onChange={(e) => setExamens(e.target.value)}
              placeholder="Biologie, imagerie, ECG, etc." rows={2}
              className={`w-full p-3 rounded-xl border outline-none resize-none transition ${
                darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200"
              }`}
            />
          </div>

          {/* PIECES JOINTES */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Pieces jointes
              <span className={`text-xs font-normal ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                (max 3 fichiers, 5 MB chacun)
              </span>
            </label>
            <label className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition ${
              darkMode ? "border-gray-700 hover:border-gray-600 text-gray-400" : "border-gray-300 hover:border-blue-400 text-gray-500"
            }`}>
              <Paperclip size={18} />
              <span className="text-sm">
                {files.length > 0 ? `${files.length} fichier(s) selectionne(s)` : "Cliquez pour ajouter des documents"}
              </span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileChange} />
            </label>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                    darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-50 text-gray-600"
                  }`}>
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="ml-2 flex-shrink-0 opacity-60">
                      {(file.size / 1024).toFixed(0)} Ko
                    </span>
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ERREUR */}
          {erreurEnvoi && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
              <AlertCircle size={16} />
              {erreurEnvoi}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-5 border-t ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"
          }`}>
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={sending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
            <Stethoscope size={16} />
            {sending ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}