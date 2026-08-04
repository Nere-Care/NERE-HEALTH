import { X, Download, Eye, FileText, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function DocumentsModal({ 
  darkMode, 
  doctor, 
  documents, 
  onClose, 
  onValidate, 
  onReject,       // ✅ Nouvelle prop pour l'action de validation
  isSubmitting = false // ✅ Nouvelle prop pour l'état de chargement
}) {
  const handlePreview = (doc) => {
    // Si c'est un base64 ou une URL relative, on l'ouvre directement
    window.open(doc.url, "_blank");
  };

  const handleDownload = (doc) => {
    const a = document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col
        ${darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"}`}>

        {/* HEADER */}
        <div className={`flex items-center justify-between p-5 border-b flex-shrink-0 
          ${darkMode ? "border-slate-700" : "border-gray-100"}`}>
          <div>
            <h2 className="text-xl font-bold">Documents justificatifs</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Dr. {doctor?.prenom} {doctor?.nom}
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY (Liste des documents) */}
        <div className="p-5 max-h-[50vh] overflow-y-auto flex-1">
          {documents && documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className={`p-4 rounded-xl border flex items-center justify-between
                  ${darkMode ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.size} • {doc.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handlePreview(doc)}
                      className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition" title="Aperçu">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition" title="Télécharger">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-400">Aucun document soumis par ce médecin</p>
            </div>
          )}
        </div>

        {/* ✅ FOOTER : Boutons d'action */}
       <div className={`p-5 border-t flex-shrink-0 ${darkMode ? "border-slate-800 bg-slate-900/80" : "border-gray-100 bg-gray-50/80"}`}>
          <div className="flex items-center gap-3">
            {/* Bouton Annuler (Neutre) */}
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition flex items-center justify-center
                ${darkMode 
                  ? "border-slate-700 hover:bg-slate-800 text-slate-300" 
                  : "border-gray-300 hover:bg-gray-100 text-gray-700"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Annuler
            </button>

            {/* Bouton Refuser (Avertissement Rouge) */}
            <button
              onClick={onReject}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle size={18} />
              Refuser
            </button>

            {/* Bouton Valider (Action Principale Verte) */}
            <button
              onClick={onValidate}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Valider
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}