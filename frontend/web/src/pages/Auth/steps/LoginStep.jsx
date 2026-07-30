import { useState } from "react";
import { Mail, User, Stethoscope, BriefcaseMedical } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import { login, googleLogin } from "../../../services/auth";

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
}) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [googleCredential, setGoogleCredential] = useState(null);
  const [googleInfo, setGoogleInfo] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");

    try {
      const user = await login(email, password);
      saveUser(user);
      const redirectPath = redirectByRole(user.role);
      if (redirectPath.startsWith("http")) {
        window.location.href = redirectPath;
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setApiError("Email ou mot de passe incorrect");
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
      } else {
        saveUser(result);
        const redirectPath = redirectByRole(result.role);
        if (redirectPath.startsWith("http")) {
          window.location.href = redirectPath;
        } else {
          navigate(redirectPath);
        }
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
      const user = await googleLogin(googleCredential, selectedRole);
      saveUser(user);
      const redirectPath = redirectByRole(user.role);
      if (redirectPath.startsWith("http")) {
        window.location.href = redirectPath;
      } else {
        navigate(redirectPath);
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
            width="100%"
            useOneTap
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
