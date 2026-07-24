import { useState, useRef } from "react";
import { Upload, CheckCircle } from "lucide-react";
import { post } from "../../../services/apiClient";
import { DOC_TYPES as TYPES_DOCUMENTS } from "../../../constants/medicalOptions";
import Modal from "../../common/Modal";

function genererChecksum(b64) {
  let hash = 0;
  const str = typeof b64 === "string" ? b64 : String(b64);
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

export default function DocumentUploadModal({ patientId, patientName, darkMode, onClose, onUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nom_fichier_original: "",
    type_document: "",
    date_document: "",
    description: "",
    fichier: null,
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      fichier: file,
      nom_fichier_original: prev.nom_fichier_original || file.name.replace(/\.[^.]+$/, ""),
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.nom_fichier_original.trim()) {
      setError("Veuillez donner un nom au document");
      return;
    }
    if (!form.type_document) {
      setError("Veuillez choisir un type de document");
      return;
    }
    if (!form.fichier) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(form.fichier);
      });

      const b64content = base64.split(",")[1];
      const checksum = genererChecksum(b64content);

      await post("/api/documents_medicaux", {
        patient_id: patientId,
        type_document: form.type_document,
        nom_fichier_original: form.nom_fichier_original,
        nom_fichier_stockage: form.fichier.name,
        url_stockage: base64,
        checksum_sha256: checksum,
        taille_octets: form.fichier.size,
        mime_type: form.fichier.type,
        est_chiffre: false,
        visible_patient: true,
        description: form.description || null,
        date_document: form.date_document || null,
      });

      setSuccess(true);
      setTimeout(() => {
        onUploaded?.();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Modal open={true} onClose={() => {}} title="" darkMode={darkMode} size="max-w-sm">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-lg">Document ajouté</p>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Le document a été enregistré dans le dossier de {patientName}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={true} onClose={onClose} title={<><Upload className="w-5 h-5 text-blue-500" /> Ajouter un document</>} darkMode={darkMode} size="max-w-lg">
      <div className="space-y-4">
          <div>
            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Nom du document *
            </label>
            <input
              type="text"
              value={form.nom_fichier_original}
              onChange={(e) => setForm((p) => ({ ...p, nom_fichier_original: e.target.value }))}
              placeholder="Ex: Bilan sanguin janvier"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "border-gray-300 text-gray-800 focus:border-blue-400"
                }`}
            />
          </div>

          <div>
            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Type de document *
            </label>
            <select
              value={form.type_document}
              onChange={(e) => setForm((p) => ({ ...p, type_document: e.target.value }))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "border-gray-300 text-gray-800 focus:border-blue-400"
                }`}
            >
              <option value="">Sélectionner un type...</option>
              {TYPES_DOCUMENTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Date du document
            </label>
            <input
              type="date"
              value={form.date_document}
              onChange={(e) => setForm((p) => ({ ...p, date_document: e.target.value }))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  : "border-gray-300 text-gray-800 focus:border-blue-400"
                }`}
            />
          </div>

          <div>
            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Description (optionnelle)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Informations complémentaires..."
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition ${darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  : "border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-400"
                }`}
            />
          </div>

          <div>
            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Fichier *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className={`w-full text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100`}
            />
            {form.fichier && (
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {form.fichier.name} ({(form.fichier.size / 1024).toFixed(1)} Ko)
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <X size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Envoi..." : "Ajouter"}
          </button>
        </div>
    </Modal>
  );
}
