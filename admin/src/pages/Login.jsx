import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, verifyAdminTwoFactor } from "../services/auth";
import { LogIn, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await loginAdmin(email, password);
      if (result.requires_2fa) {
        setTwoFaToken(result.totp_token);
        setTwoFaCode("");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFa = async (e) => {
    e.preventDefault();
    if (!twoFaCode.trim()) {
      setError("Veuillez saisir le code de vérification");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await verifyAdminTwoFactor(twoFaCode.trim(), twoFaToken);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center">
            {twoFaToken ? <ShieldCheck className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Néré Admin</h1>
          <p className="text-gray-500 mt-1">
            {twoFaToken
              ? "Vérification en deux étapes"
              : "Connectez-vous pour administrer la plateforme"}
          </p>
        </div>

        {twoFaToken ? (
          <form onSubmit={handleTwoFa} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code à 6 chiffres</label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition tracking-[0.3em] text-center text-lg"
                placeholder="••••••"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
            >
              {loading ? "Vérification..." : "Valider"}
            </button>

            <button
              type="button"
              onClick={() => { setTwoFaToken(""); setTwoFaCode(""); setError(""); }}
              className="w-full text-gray-500 text-sm hover:underline"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="admin@nere.health"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
