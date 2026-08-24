import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock } from "lucide-react";
import PasswordInput from "../../components/form/PasswordInput";
import { resetPassword } from "../../services/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!token) {
      setError("Lien de réinitialisation invalide ou manquant");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F9FF] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl px-6 py-10">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#2F80ED]/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-[#2F80ED]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2F80ED] mb-2">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {success ? (
          <>
            <p className="text-center text-green-600 text-sm mb-6">
              Votre mot de passe a été réinitialisé avec succès.
            </p>
            <Link
              to="/"
              className="block w-full bg-[#27AE60] text-white p-3 rounded-xl hover:bg-[#1E8A4D] transition text-center font-medium shadow-lg shadow-green-100"
            >
              Aller à la connexion
            </Link>
          </>
        ) : (
          <div className="space-y-4">
            <PasswordInput
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <PasswordInput
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Enregistrer le nouveau mot de passe"}
            </button>
          </div>
        )}

        <Link to="/" className="block text-center text-sm text-gray-500 mt-6 hover:underline">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
