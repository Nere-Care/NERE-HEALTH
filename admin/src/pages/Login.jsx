import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Lock, Mail } from "lucide-react";
import { loginAdmin } from "../services/AuthService";

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [serverError, setServerError] = useState(null);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = "L'adresse email est obligatoire.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Adresse email invalide.";
    }
    if (!password) {
      errs.password = "Le mot de passe est obligatoire.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setServerError(null);
      await loginAdmin(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setServerError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase = `w-full pl-10 pr-4 py-3 rounded-xl border outline-none text-sm transition
    bg-white border-gray-300 placeholder-gray-400
    focus:border-blue-500 focus:ring-2 focus:ring-blue-100`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 shadow-xl mb-4">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NERE Health</h1>
          <p className="text-blue-300 mt-1 text-sm">Interface d'administration</p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800">Connexion administrateur</h2>
            <p className="text-gray-500 text-sm mt-1">
              Accès réservé au personnel autorisé
            </p>
          </div>

          {serverError && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: null }));
                  }}
                  placeholder="admin@nere-health.cm"
                  className={inputBase}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <FieldError message={errors.email} />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
                hover:bg-blue-700 transition disabled:opacity-50
                flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Accéder au tableau de bord
                </>
              )}
            </button>
          </form>

          {/* Note sécurité */}
          <div className="mt-6 flex items-start gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} className="flex-shrink-0 mt-0.5 text-green-500" />
            <p>
              Connexion sécurisée par JWT. Toutes les actions sont auditées.
              Accès non autorisé passible de sanctions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-300/60 text-xs mt-6">
          NERE Health Admin — v1.0 • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}