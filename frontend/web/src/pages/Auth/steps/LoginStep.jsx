import { useState } from "react";
import { Mail, User, Stethoscope, BriefcaseMedical, ShieldCheck, KeyRound } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import { login, googleLogin, verifyTwoFactor, resendVerification } from "../../../services/auth";

const ROLES = [
  { key: "patient", label: "Patient", icon: User, desc: "Accéder à mes données médicales" },
  { key: "medecin", label: "Médecin", icon: Stethoscope, desc: "Suivi et consultation de patients" },
  { key: "infirmier", label: "Infirmier", icon: BriefcaseMedical, desc: "Soins et assistance médicale" },
];

export default function LoginStep({
  email,
  password,
  setEmail,
  setPassword,
  errors = {},
  navigate,
  saveUser,
  redirectByRole,
  validateForm,
  setIsLogin,
  onForgotPassword,
}) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googleInfo, setGoogleInfo] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [verifDev, setVerifDev] = useState(null);

  const goToDashboard = (user) => {
    saveUser(user);
    const redirectPath = redirectByRole(user.role);
    if (redirectPath.startsWith("http")) {
      window.location.href = redirectPath;
    } else {
      navigate(redirectPath);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");

    try {
      const result = await login(email, password);
      if (result.requires_2fa) {
        setTwoFaToken(result.totp_token);
        setTwoFaCode("");
      } else {
        goToDashboard(result);
      }
    } catch (err) {
      setApiError(err.message || "Email ou mot de passe incorrect");
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
        setResendMessage("");
        setResendError("");
        setVerifDev(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage("");
    setResendError("");
    setVerifDev(null);
    try {
      const data = await resendVerification({ email });
      if (data.dev_verification_code || data.dev_verification_token) {
        setVerifDev(data);
      }
      setResendMessage("Un nouveau lien de confirmation a été envoyé. Vérifiez votre boîte mail.");
    } catch (err) {
      setResendError(err.message || "Impossible de renvoyer le lien. Réessayez plus tard.");
    } finally {
      setResending(false);
    }
  };

  const handleTwoFa = async () => {
    if (!twoFaCode.trim()) {
      setApiError("Veuillez saisir le code de vérification");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      const user = await verifyTwoFactor(twoFaCode.trim(), twoFaToken);
      setTwoFaToken("");
      goToDashboard(user);
    } catch (err) {
      setApiError(err.message || "Code de vérification incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setApiError("");
    setLoading(true);
    try {
      const result = await googleLogin(credentialResponse.credential);
      if (result.needs_role) {
        setGoogleCredential(credentialResponse.credential);
        setGoogleInfo(result);
      } else if (result.requires_2fa) {
        setTwoFaToken(result.totp_token);
        setTwoFaCode("");
      } else {
        goToDashboard(result);
      }
    } catch (err) {
      setApiError(err.message || "Erreur lors de la connexion Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRoleConfirm = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setApiError("");
    try {
      const result = await googleLogin(googleCredential, selectedRole);
      if (result.requires_2fa) {
        setTwoFaToken(result.totp_token);
        setTwoFaCode("");
      } else {
        goToDashboard(result);
      }
    } catch (err) {
      setApiError(err.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setApiError("Connexion Google annulée ou échouée");
  };

  if (twoFaToken) {
    return (
      <>
        <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#2F80ED]/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#2F80ED]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Vérification en deux étapes</h3>
            <p className="text-sm text-gray-500 mt-1">
              Saisissez le code à 6 chiffres généré par votre application d'authentification.
            </p>
          </div>

          <div className="space-y-5">
            <Input
              icon={<ShieldCheck className="w-5 h-5 text-gray-500" />}
              placeholder="Code à 6 chiffres"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
            />

            {apiError && (
              <p className="text-red-500 text-sm mt-2 text-center">{apiError}</p>
            )}

            <button
              className="w-full bg-[#2F80ED] text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
              onClick={handleTwoFa}
              disabled={loading}
            >
              {loading ? "Vérification..." : "Valider"}
            </button>

            <button
              onClick={() => { setTwoFaToken(""); setTwoFaCode(""); setApiError(""); }}
              className="w-full text-gray-500 text-sm hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </>
    );
  }

  if (googleInfo) {
    return (
      <>
        <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
          <div className="text-center mb-6">
            {googleInfo.photo_url && (
              <img src={googleInfo.photo_url} alt="" className="w-16 h-16 rounded-full mx-auto mb-3" />
            )}
            <h3 className="text-lg font-semibold text-gray-800">
              Bienvenue {googleInfo.prenom}
            </h3>
            <p className="text-sm text-gray-500">{googleInfo.email}</p>
            <p className="text-sm text-gray-500 mt-2">Choisissez votre type de compte</p>
          </div>

          <div className="space-y-2">
            {ROLES.map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                  selectedRole === key
                    ? "border-[#2F80ED] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRole === key ? "bg-[#2F80ED] text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleGoogleRoleConfirm}
            disabled={!selectedRole || loading}
            className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {loading ? "Création du compte..." : "Continuer"}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        <div className="space-y-5">
          <Input
            icon={<Mail className="w-5 h-5 text-gray-500" />}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errors?.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email}
            </p>
          )}

          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errors?.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password}
            </p>
          )}

          {apiError && (
            <p className="text-red-500 text-sm mt-2 text-center">
              {apiError}
            </p>
          )}

          {needsVerification && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
              <p className="text-sm text-amber-800">
                Votre adresse email n'est pas encore confirmée. Renvoyez un
                lien de confirmation, puis cliquez dessus (ou saisissez le code
                reçu sur la page de confirmation).
              </p>

              {verifDev?.dev_verification_code && (
                <div className="rounded-lg bg-white border border-dashed border-amber-300 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Code de vérification (mode développement)
                  </p>
                  <p className="text-2xl font-bold tracking-[0.3em] text-[#2F80ED]">
                    {verifDev.dev_verification_code}
                  </p>
                </div>
              )}

              {verifDev?.dev_verification_token && (
                <div className="rounded-lg bg-white border border-dashed border-amber-300 p-3">
                  <p className="text-xs text-gray-500 mb-1">
                    Lien (mode développement) — cliquez pour confirmer :
                  </p>
                  <a
                    href={`/verify-email?token=${verifDev.dev_verification_token}`}
                    className="text-xs text-blue-700 underline break-all hover:text-blue-900"
                  >
                    {window.location.origin}/verify-email?token={verifDev.dev_verification_token}
                  </a>
                </div>
              )}

              {resendMessage && (
                <p className="text-green-600 text-sm text-center">{resendMessage}</p>
              )}
              {resendError && (
                <p className="text-red-500 text-sm text-center">{resendError}</p>
              )}

              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full bg-[#2F80ED] text-white p-2.5 rounded-xl hover:bg-[#044EC8] transition font-medium disabled:opacity-50"
              >
                {resending ? "Envoi..." : "Renvoyer le lien de confirmation"}
              </button>
            </div>
          )}
        </div>

        <div className="text-right mt-3">
          <span
            onClick={onForgotPassword}
            className="text-[#2F80ED] text-sm cursor-pointer font-medium hover:underline"
          >
            Mot de passe oublié ?
          </span>
        </div>

        <button
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Connexion..." : "Login"}
        </button>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="continue_with"
            shape="rectangular"
            size="large"
          />
        </div>
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Don't have an account yet?{" "}
        <span
          onClick={() => setIsLogin(false)}
          className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
        >
          Sign up
        </span>
      </p>
    </>
  );
}
