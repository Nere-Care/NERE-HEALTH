import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, CheckCircle2, Hourglass, AlertCircle, RefreshCw, KeyRound } from "lucide-react";
import Input from "../../components/form/Input";
import { verifyEmail, verifyEmailCode, resendVerification } from "../../services/auth";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(token ? "loading" : "idle");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devToken, setDevToken] = useState("");
  const [role, setRole] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await verifyEmail(token);
        if (!cancelled) {
          setRole(res.role || "");
          setStatus("success");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message || "Ce lien de confirmation a expiré ou est invalide.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setMessage("Veuillez saisir votre adresse email pour recevoir un nouveau lien.");
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    setMessage("");
    setIsSuccess(false);
    setDevCode("");
    setDevToken("");
    try {
      const data = await resendVerification({ email: email.trim() });
      if (data.dev_verification_code) setDevCode(data.dev_verification_code);
      if (data.dev_verification_token) setDevToken(data.dev_verification_token);
      setMessage("Un nouveau lien de confirmation a été généré avec succès.");
      setIsSuccess(true);
    } catch (err) {
      setMessage(err.message || "Impossible de renvoyer le lien");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !code) {
      setMessage("Veuillez saisir votre email et le code reçu");
      setIsSuccess(false);
      return;
    }
    setLoading(true);
    setMessage("");
    setIsSuccess(false);
    try {
      const res = await verifyEmailCode(email.trim(), code.trim());
      setRole(res.role || "");
      setStatus("success");
    } catch (err) {
      setMessage(err.message || "Code de confirmation invalide ou expiré");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F9FF] items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl px-6 py-10">
        
        {/* ICON & TITLE */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full flex items-center justify-center">
            {status === "success" ? (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="w-8 h-8 text-[#27AE60]" />
              </div>
            ) : status === "error" ? (
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            ) : (
              <div className="bg-blue-100 p-3 rounded-full">
                <Mail className="w-8 h-8 text-[#2F80ED]" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#2F80ED] mb-2">
            {status === "success" ? "Email confirmé !" : status === "error" ? "Lien invalide ou expiré" : "Confirmation d'email"}
          </h1>
        </div>

        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F80ED] mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Vérification de votre lien en cours...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="text-center space-y-4">
            {role === "medecin" ? (
              <>
                <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#B97A2B]/10 flex items-center justify-center">
                  <Hourglass className="w-7 h-7 text-[#B97A2B]" />
                </div>
                <p className="text-gray-600 text-sm">Votre adresse email a été confirmée.</p>
                <p className="font-semibold text-gray-800">
                  Votre compte est en attente de validation par un administrateur.
                </p>
                <p className="text-gray-600 text-sm font-medium">
                  Connectez-vous et complétez votre profil pour que l'admin valide rapidement.
                </p>
                <Link
                  to="/"
                  className="block w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition text-center font-medium shadow-lg shadow-blue-100"
                >
                  Se connecter maintenant
                </Link>
              </>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  Votre adresse email a été confirmée avec succès. Vous pouvez maintenant vous connecter.
                </p>
                <Link
                  to="/"
                  className="block w-full bg-[#27AE60] text-white p-3 rounded-xl hover:bg-[#1E8A4D] transition text-center font-medium shadow-lg shadow-green-100"
                >
                  Se connecter
                </Link>
              </>
            )}
          </div>
        )}

        {/* IDLE / ERROR / RESEND FORM */}
        {(status === "idle" || status === "error") && (
          <div className="space-y-4">
            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
                Ce lien de confirmation a expiré ou a déjà été utilisé. Entrez votre adresse email ci-dessous pour recevoir un nouveau lien.
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-xl text-sm text-center font-medium ${isSuccess ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}

            {/* DEV MODE NEW LINK BOX */}
            {devToken && (
              <div className="rounded-xl bg-blue-50 border-2 border-blue-400 p-4 text-center space-y-2 shadow-md">
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Mode Développement Actif
                </p>
                <p className="text-xs text-blue-700">Un nouveau lien a été généré :</p>
                <a
                  href={`/verify-email?token=${devToken}`}
                  className="inline-block w-full bg-[#2F80ED] text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[#044EC8] transition shadow"
                >
                  🔗 Valider mon email avec le nouveau lien
                </a>
              </div>
            )}

            {/* DEV MODE CODE BOX */}
            {devCode && (
              <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Code de confirmation (dev)</p>
                <p className="text-2xl font-bold tracking-[0.3em] text-[#2F80ED]">
                  {devCode}
                </p>
              </div>
            )}

            {/* RESEND LINK FORM */}
            <form onSubmit={handleResend} className="space-y-3">
              <label className="text-xs font-medium text-gray-700 block">
                Adresse email de votre compte
              </label>
              <Input
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                placeholder="Ex: exemple@nere.health"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Génération en cours..." : "Renvoyer un nouveau lien de confirmation"}
              </button>
            </form>

            {/* CODE INPUT TOGGLE */}
            <div className="pt-2 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="text-xs text-gray-500 hover:text-[#2F80ED] transition underline"
              >
                {showCodeInput ? "Masquer la saisie par code à 6 chiffres" : "J'ai un code à 6 chiffres à valider manuellement"}
              </button>
            </div>

            {showCodeInput && (
              <form onSubmit={handleCodeSubmit} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Entrez le code à 6 chiffres reçu dans l'email :
                </p>
                <Input
                  icon={<KeyRound className="w-5 h-5 text-gray-400" />}
                  placeholder="000000"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-800 text-white p-2.5 rounded-xl hover:bg-gray-900 transition font-medium text-sm disabled:opacity-50"
                >
                  Valider le code
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
