import { X, Download, Eye, FileText, AlertCircle } from "lucide-react";

export default function DocumentsModal({ darkMode, doctor, documents, onPreview, onDownload, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>
        
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Documents</h2>
            <p className="text-sm text-gray-400 mt-0.5">{doctor.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className={`p-4 rounded-xl border flex items-center justify-between ${
                  darkMode ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.size} • PDF</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => onPreview(doc)}
                      className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition" title="Aperçu">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => onDownload(doc)}
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
              <p className="text-gray-400">Aucun document disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}