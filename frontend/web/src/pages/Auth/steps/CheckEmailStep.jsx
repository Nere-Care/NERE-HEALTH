import { useState } from "react";
import { Mail, KeyRound, ShieldCheck, CheckCircle2, Hourglass } from "lucide-react";
import { resendVerification, verifyEmailCode } from "../../../services/auth";

export default function CheckEmailStep({ email, devData = {}, onBackToLogin }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dev, setDev] = useState(devData);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [role, setRole] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await resendVerification({ email });
      if (data.dev_verification_code || data.dev_verification_token) {
        setDev(data);
      }
      setMessage("Un nouveau lien de confirmation a été envoyé. Vérifiez votre boîte mail.");
    } catch (err) {
      setError(err.message || "Impossible de renvoyer le lien");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!code.trim()) {
      setError("Veuillez saisir le code reçu");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await verifyEmailCode(email, code.trim());
      setRole(res.role || "");
      setVerified(true);
    } catch (err) {
      setError(err.message || "Code de confirmation invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    if (role === "medecin") {
      return (
        <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#B97A2B]/10 flex items-center justify-center">
              <Hourglass className="w-7 h-7 text-[#B97A2B]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Compte en attente de validation</h3>
            <p className="text-sm text-gray-500 mt-2">
              Votre adresse email a été confirmée. Votre compte est en attente de
              validation par un administrateur.
            </p>
            <p className="text-sm font-medium text-gray-600 mt-2">
              Connectez-vous et complétez votre profil pour que l'admin valide rapidement.
            </p>
          </div>
          <button
            onClick={onBackToLogin}
            className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
          >
            Se connecter maintenant
          </button>
        </div>
      );
    }
    return (
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#27AE60]/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-[#27AE60]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Adresse email confirmée</h3>
          <p className="text-sm text-gray-500 mt-1">
            Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.
          </p>
        </div>
        <button
          onClick={onBackToLogin}
          className="w-full bg-[#27AE60] text-white p-3 rounded-xl hover:bg-[#1E8A4D] transition font-medium shadow-lg shadow-green-100"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#27AE60]/10 flex items-center justify-center">
          <Mail className="w-7 h-7 text-[#27AE60]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Vérifiez votre adresse email</h3>
        <p className="text-sm text-gray-500 mt-1">
          Un email de confirmation a été envoyé à <span className="font-semibold text-gray-700">{email}</span>.
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Cliquez sur le lien de confirmation, ou saisissez le code à 6 chiffres reçu.
        </p>
      </div>

      <div className="space-y-4">
        {dev.dev_verification_code && (
          <div className="rounded-xl bg-white border border-dashed border-gray-300 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> Code de vérification (mode développement)
            </p>
            <p className="text-2xl font-bold tracking-[0.3em] text-[#2F80ED]">
              {dev.dev_verification_code}
            </p>
          </div>
        )}

        {dev.dev_verification_token && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-700 mb-1">
              Lien (mode développement) — cliquez pour confirmer :
            </p>
            <a
              href={`/verify-email?token=${dev.dev_verification_token}`}
              className="text-xs text-blue-700 underline break-all hover:text-blue-900"
            >
              {window.location.origin}/verify-email?token={dev.dev_verification_token}
            </a>
          </div>
        )}

        {showCodeInput && (
          <div className="rounded-xl bg-white border border-dashed border-gray-300 p-4">
            <label className="text-xs text-gray-500 mb-2 block">Code à 6 chiffres</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              className="w-full text-center text-2xl font-bold tracking-[0.3em] text-[#2F80ED] border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#2F80ED]/30"
            />
            <button
              onClick={handleCodeSubmit}
              disabled={loading}
              className="mt-3 w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Confirmer le code"}
            </button>
          </div>
        )}

        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Envoi..." : "Renvoyer l'email de confirmation"}
        </button>

        <button
          onClick={() => setShowCodeInput(!showCodeInput)}
          className="w-full flex items-center justify-center gap-1 text-[#2F80ED] text-sm font-medium hover:underline"
        >
          <ShieldCheck className="w-4 h-4" />
          {showCodeInput ? "Masquer la saisie du code" : "J'ai un code de vérification"}
        </button>

        <p className="text-sm text-center text-gray-600">
          <span
            onClick={onBackToLogin}
            className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
          >
            Retour à la connexion
          </span>
        </p>
      </div>
    </div>
  );
}
