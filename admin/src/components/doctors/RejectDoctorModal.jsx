// components/doctors/RejectDoctorModal.jsx
import { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";

export default function RejectDoctorModal({ darkMode, doctor, onClose, onConfirm, isSubmitting }) {
  const [motif, setMotif] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!motif.trim()) return;
    onConfirm(motif);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Refuser la validation</h2>
              <p className="text-xs text-gray-400 mt-0.5">Dr. {doctor?.prenom} {doctor?.nom}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Instructions & documents manquants à préciser <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Indiquez clairement au médecin les pièces justificatives manquantes ou non conformes..."
              className={`w-full p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-red-500 transition text-sm ${
                darkMode ? "border-slate-700 text-white placeholder-gray-500" : "border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          <p className="text-xs text-gray-400">
            Un e-mail d'instruction contenant ces éléments sera automatiquement transmis au médecin.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl border font-medium transition ${
                darkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !motif.trim()}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</>
              ) : (
                <><Send size={16} /> Refuser & envoyer</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}