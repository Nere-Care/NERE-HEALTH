import { useState } from "react";
import { Mail } from "lucide-react";
import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import { forgotPassword, resetPassword } from "../../../services/auth";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordStep({ setShowForgot }) {
  const [phase, setPhase] = useState("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequest = async () => {
    setError("");
    if (!emailRegex.test(email)) {
      setError("Veuillez saisir un email valide");
      return;
    }
    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.reset_token) {
        setResetToken(result.reset_token);
        setPhase("reset");
      } else {
        setSuccess("Si cet email existe, une demande de réinitialisation a été envoyée.");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de la demande");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setError("");
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
      await resetPassword(resetToken, password);
      setSuccess("Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.");
      setTimeout(() => setShowForgot(false), 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
      <div className="space-y-5">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">{success}</p>}

        {phase === "email" && (
          <>
            <Input
              icon={<Mail className="w-5 h-5 text-gray-500" />}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
              onClick={handleRequest}
              disabled={loading}
            >
              {loading ? "Envoi..." : "Réinitialiser le mot de passe"}
            </button>
          </>
        )}

        {phase === "reset" && (
          <>
            <p className="text-sm text-gray-600 text-center">
              Nouveau mot de passe pour <span className="font-semibold">{email}</span>
            </p>

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

            <button
              className="w-full bg-[#27AE60] text-white p-3 rounded-xl hover:bg-[#1E8A4D] transition font-medium shadow-lg shadow-green-100 disabled:opacity-50"
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? "Réinitialisation..." : "Enregistrer le nouveau mot de passe"}
            </button>
          </>
        )}
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Revenir à la{" "}
        <span
          onClick={() => setShowForgot(false)}
          className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
        >
          connexion
        </span>
      </p>
    </div>
  );
}
