import { X, Download, Eye, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

export default function DocumentsModal({ 
  darkMode, 
  doctor, 
  documents, 
  onClose, 
  onValidate,        // ✅ Nouvelle prop pour l'action de validation
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
        <div className={`p-5 border-t flex-shrink-0 ${darkMode ? "border-slate-700 bg-slate-900/50" : "border-gray-100 bg-gray-50"}`}>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl border font-medium transition flex items-center justify-center gap-2
                ${darkMode ? "border-slate-600 hover:bg-slate-800 text-gray-300" : "border-gray-300 hover:bg-gray-100 text-gray-700"}
                ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Annuler
            </button>
            
            <button
              onClick={onValidate}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Valider le profil
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}