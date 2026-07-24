import { useState, useRef } from "react";
import { X, Download, Eye, FileText, AlertCircle, Upload } from "lucide-react";
import API from "../../services/api";
import { toast } from "react-hot-toast";

export default function DocumentsModal({
  darkMode,
  doctor,
  documents = [],
  onClose,
  onRefresh,
}) {
  const itemId = doctor?.id;
  const docs = Array.isArray(documents) ? documents : [];
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // { url, nom, mime }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      await API.post(`/medecins/${itemId}/documents/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document ajouté");
      onRefresh?.();
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (index) => {
    try {
      await API.delete(`/medecins/${itemId}/documents/${index}`);
      toast.success("Document supprimé");
      onRefresh?.();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getDocUrl = (doc) => {
    if (!doc?.url) return null;
    if (doc.url.startsWith("http")) return doc.url;
    return `${import.meta.env.VITE_API_URL || ""}${doc.url}`;
  };

  const downloadFile = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur réseau");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Erreur lors du téléchargement");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">Documents</h2>
            <p className="text-sm text-gray-400 mt-0.5">{doctor?.name || "Médecin"}</p>
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
              const docType = doc?.type || doc?.mime_type || "";
              const docUrl = getDocUrl(doc);

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
                    {docUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc({ url: docUrl, nom: docName, mime: docType })}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition"
                        title="Voir"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {docUrl && (
                      <button
                        type="button"
                        onClick={() => downloadFile(docUrl, docName)}
                        className="p-2 rounded-lg hover:bg-green-500/10 text-green-500 transition"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(index)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                      title="Supprimer"
                    >
                      <X size={16} />
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

          {/* Upload button */}
          <button
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition disabled:opacity-50
              dark:border-slate-600 dark:text-gray-400 dark:hover:border-slate-500
              border-gray-300 text-gray-500 hover:border-gray-400"
          >
            {uploading ? (
              <><span className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></span> Upload...</>
            ) : (
              <><Upload size={16} /> Uploader un document</>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={handleFileUpload}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          />
        </div>
      </div>

      {/* MODAL APERÇU DOCUMENT */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className={`relative max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${darkMode ? "bg-slate-900" : "bg-white"}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-5 py-3 border-b ${darkMode ? "border-slate-700" : "border-gray-200"}`}>
              <p className={`font-semibold text-sm truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{previewDoc.nom}</p>
              <button onClick={() => setPreviewDoc(null)} className="ml-3 text-gray-400 hover:text-gray-200 transition flex-shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 max-h-[calc(90vh-60px)] overflow-auto flex items-start justify-center bg-black/5">
              {previewDoc.mime?.startsWith("image/") ? (
                <img src={previewDoc.url} alt={previewDoc.nom} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
              ) : previewDoc.mime === "application/pdf" || previewDoc.url?.toLowerCase().endsWith(".pdf") ? (
                <embed src={previewDoc.url} type="application/pdf" className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aperçu non disponible</p>
                  <p className="text-xs mt-1">Ce type de fichier ne peut pas être affiché directement.</p>
                  <button
                    type="button"
                    onClick={() => downloadFile(previewDoc.url, previewDoc.nom)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 font-medium">
                    <Download size={14} /> Télécharger le fichier
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
