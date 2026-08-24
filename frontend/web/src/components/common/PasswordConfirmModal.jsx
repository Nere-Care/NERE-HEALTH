// components/PasswordConfirmModal.jsx
import { useState } from 'react';
import { Lock, Loader, AlertCircle, X } from 'lucide-react';
import { verifierMotDePasse } from '../../services/authService';

export default function PasswordConfirmModal({ isOpen, onClose, onSuccess, title = "Confirmation requise" }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      await verifierMotDePasse(token, password);
      setPassword("");
      onSuccess(); // Exécute l'action protégée
      onClose();   // Ferme la modal
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700 relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-xl">
            <Lock size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-base">{title}</h3>
            <p className="text-xs text-gray-500">Veuillez entrer votre mot de passe pour accéder à cette section.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-white text-sm outline-none focus:border-blue-500"
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-xl transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!password || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader size={14} className="animate-spin" />}
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}