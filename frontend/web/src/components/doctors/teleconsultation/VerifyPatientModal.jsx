import { useState } from "react";
import { Shield, X, AlertCircle, CheckCircle } from "lucide-react";
import { post } from "../../../services/apiClient";

export default function VerifyPatientModal({ darkMode, rdv, onVerified, onCancel }) {
  const [nss, setNss] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    if (!nss.trim() || !code.trim()) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await post(`/api/rendez_vous/${rdv.rdvId}/verify`, {
        nss: nss.trim(),
        code: code.trim(),
      });
      onVerified();
    } catch (err) {
      setError(err.message || "Vérification échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Vérification patient
                </h3>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {rdv.patientName}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className={`p-1 rounded-lg transition ${
                darkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Demandez au patient son <strong>NSS</strong> et le <strong>code unique</strong> reçu par message.
          </p>

          {/* NSS */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Numéro de Sécurité Sociale (NSS)
            </label>
            <input
              type="text"
              value={nss}
              onChange={(e) => setNss(e.target.value)}
              placeholder="Ex: 1850123456789"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Code */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Code unique
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: A3B7K9"
              maxLength={6}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono tracking-widest text-center outline-none transition focus:ring-2 focus:ring-blue-500 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex gap-3 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <button
            onClick={onCancel}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              darkMode
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Annuler
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !nss.trim() || !code.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={16} />
                Vérifier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
