import { useState } from "react";
import { X, Download, Eye, FileText, AlertCircle, Plus, Trash2 } from "lucide-react";
import API from "../../services/api";
import { toast } from "react-hot-toast";

export default function DocumentsModal({
  darkMode,
  doctor,
  structure,
  patient,
  documents = [],
  onPreview,
  onDownload,
  onClose,
  onRefresh,
}) {
  const item = doctor || structure || patient;
  const itemName = item?.name || item?.nom || "Inconnu";
  const itemId = item?.id;
  const docs = Array.isArray(documents) ? documents : [];

  const [showForm, setShowForm] = useState(false);
  const [docForm, setDocForm] = useState({ nom: "", type: "PDF", taille: "", url: "" });

  const handleAdd = async () => {
    if (!docForm.nom) {
      toast.error("❌ Le nom du document est requis");
      return;
    }
    try {
      await API.post(`/structures/${itemId}/documents`, docForm);
      toast.success("✅ Document ajouté");
      setShowForm(false);
      setDocForm({ nom: "", type: "PDF", taille: "", url: "" });
      onRefresh?.();
    } catch {
      toast.error("❌ Erreur lors de l'ajout du document");
    }
  };

  const handleDelete = async (index) => {
    try {
      await API.delete(`/structures/${itemId}/documents/${index}`);
      toast.success("🗑️ Document supprimé");
      onRefresh?.();
    } catch {
      toast.error("❌ Erreur lors de la suppression");
    }
  };

  const inputClass = `w-full p-2.5 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 text-sm transition ${
    darkMode ? "border-slate-700" : "border-gray-300"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Documents</h2>
            <p className="text-sm text-gray-400 mt-0.5">{itemName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {docs.length > 0 ? (
            docs.map((doc, index) => {
              const docName = doc?.nom || doc?.name || "Document sans nom";
              const docSize = doc?.taille || doc?.size || "";
              const docType = doc?.type || "";

              return (
                <div key={index} className={`p-4 rounded-xl border flex items-center justify-between ${
                  darkMode ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{docName}</p>
                      <p className="text-xs text-gray-400">
                        {[docType, docSize].filter(Boolean).join(" • ") || "Document"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {doc?.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition"
                        title="Voir"
                      >
                        <Eye size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <AlertCircle size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-400">Aucun document</p>
            </div>
          )}

          {/* Add form */}
          {showForm ? (
            <div className={`p-4 rounded-xl border space-y-3 ${
              darkMode ? "border-slate-700 bg-slate-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <input
                placeholder="Nom du document *"
                value={docForm.nom}
                onChange={(e) => setDocForm({ ...docForm, nom: e.target.value })}
                className={inputClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  className={inputClass}
                >
                  <option value="PDF">PDF</option>
                  <option value="Image">Image</option>
                  <option value="Word">Word</option>
                  <option value="Excel">Excel</option>
                  <option value="Autre">Autre</option>
                </select>
                <input
                  placeholder="Taille (ex: 2.5 Mo)"
                  value={docForm.taille}
                  onChange={(e) => setDocForm({ ...docForm, taille: e.target.value })}
                  className={inputClass}
                />
              </div>
              <input
                placeholder="URL (lien vers le document)"
                value={docForm.url}
                onChange={(e) => setDocForm({ ...docForm, url: e.target.value })}
                className={inputClass}
              />
              <div className="flex gap-2">
                <button onClick={() => { setShowForm(false); setDocForm({ nom: "", type: "PDF", taille: "", url: "" }); }}
                  className="flex-1 py-2 rounded-xl border text-sm font-medium dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                  Annuler
                </button>
                <button onClick={handleAdd}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition">
                  Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition
                dark:border-slate-600 dark:text-gray-400 dark:hover:border-slate-500
                border-gray-300 text-gray-500 hover:border-gray-400">
              <Plus size={16} /> Ajouter un document
            </button>
          )}
        </div>
      </div>
    </div>
  );
}