import { useEffect, useRef, useState } from "react";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import Input from "../../../components/form/Input";
import { login, getCurrentUser, loginWithGoogle } from "../../../services/authService";
import PasswordInput from "../../../components/form/PasswordInput";
import { FcGoogle } from "react-icons/fc";

const GOOGLE_CLIENT_ID = "370116629692-j2f64k7n783qus34pv23la583g7vag22.apps.googleusercontent.com";

export default function LoginStep({
  email,
  password,
  setEmail,
  setPassword,
  errors = {},
  setErrors,
  navigate,
  saveUser,
  redirectByRole,
  validateForm,
  setIsLogin,
  onLogin,
  loading: externalLoading,
}) {
  const hiddenGoogleBtnRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = externalLoading || localLoading;

  // ============================================
  // GÉRER LA RÉPONSE GOOGLE
  // ============================================
  const handleGoogleResponse = async (response) => {
    try {
      if (!response?.credential) {
        setGoogleError("Aucun credential reçu de Google");
        return;
      }

      setGoogleLoading(true);
      setGoogleError(null);

      const authData = await loginWithGoogle(response.credential);
      localStorage.setItem("token", authData.access_token);

      const user = await getCurrentUser(authData.access_token);
      saveUser(user);
      navigate(redirectByRole(user.role));
    } catch (error) {
      console.error("❌ Google login error:", error);
      setGoogleError(error.message || "Erreur de connexion Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ============================================
  // CHARGER LE SCRIPT GOOGLE DYNAMIQUEMENT
  // ============================================
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 20;

    const initGoogle = () => {
      if (!isMounted) return;

      if (!window.google?.accounts?.id) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initGoogle, 500);
        } else {
          console.warn("⚠️ Google script non chargé après plusieurs tentatives");
          setGoogleError("Google Sign-In non disponible. Vérifiez votre connexion.");
        }
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (hiddenGoogleBtnRef.current) {
          window.google.accounts.id.renderButton(hiddenGoogleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: 300,
          });
          setGoogleReady(true);
          console.log("✅ Google Sign-In prêt");
        }
      } catch (err) {
        console.error("❌ Erreur initialisation Google:", err);
        setGoogleError("Impossible d'initialiser Google Sign-In");
      }
    };

    initGoogle();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // CLIQUER SUR LE BOUTON GOOGLE
  // ============================================
  const handleGoogleClick = () => {
    if (!window.google?.accounts?.id) {
      setGoogleError("Google Sign-In non chargé. Veuillez rafraîchir la page.");
      return;
    }

    const realGoogleButton = hiddenGoogleBtnRef.current?.querySelector('div[role="button"]');
    if (realGoogleButton) {
      realGoogleButton.click();
    } else {
      // Fallback : utiliser le prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log("Google prompt not displayed:", notification.getNotDisplayedReason());
        }
      });
    }
  };

  // ============================================
  // GESTIONNAIRE LOGIN EMAIL/PASSWORD
  // ============================================
  const handleLoginClick = async () => {
    // ✅ Utiliser onLogin si fourni (nouveau système)
    if (onLogin) {
      onLogin();
      return;
    }

    // ✅ Fallback : ancien système avec validateForm
    try {
      if (validateForm && typeof validateForm === "function") {
        if (!validateForm()) return;
      } else if (!email || !password) {
        alert("Email et mot de passe requis");
        return;
      }

      setLocalLoading(true);

      const authData = await login(email, password);
      localStorage.setItem("token", authData.access_token);

      const user = await getCurrentUser(authData.access_token);
      saveUser(user);
      navigate(redirectByRole(user.role));
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message || "Erreur de connexion");
    } finally {
      setLocalLoading(false);
    }
  };

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
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}

          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errors?.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* ERREUR GOOGLE */}
        {googleError && (
          <div className="mt-4 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{googleError}</span>
          </div>
        )}

        {/* BOUTON LOGIN */}
        <button
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={handleLoginClick}
          disabled={isLoading || googleLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connexion...
            </>
          ) : (
            "Login"
          )}
        </button>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* BOUTON GOOGLE CACHÉ */}
        <div
          ref={hiddenGoogleBtnRef}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            height: 0,
            overflow: "hidden",
            top: 0,
            left: 0,
          }}
        ></div>

        {/* BOUTON GOOGLE VISIBLE */}
        <button
          onClick={handleGoogleClick}
          disabled={googleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connexion Google...
            </>
          ) : (
            <>
              <FcGoogle className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </button>

        {/* Indicateur de statut Google */}
        {!googleReady && !googleError && (
          <p className="text-xs text-center text-gray-400 mt-2">
            Chargement de Google Sign-In...
          </p>
        )}
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