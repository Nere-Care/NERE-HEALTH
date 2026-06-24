import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";
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
  navigate,
  saveUser,
  redirectByRole,
  validateForm,
  setIsLogin,
}) {
  const hiddenGoogleBtnRef = useRef(null);

  const handleGoogleResponse = async (response) => {
    console.log("🔵 GOOGLE RAW RESPONSE:", response);
    console.log("🔵 GOOGLE CREDENTIAL:", response?.credential);
    console.log("🔵 CREDENTIAL TYPE:", typeof response?.credential);

    try {
      if (!response?.credential) {
        console.error("🔴 Aucun credential reçu de Google !");
        return;
      }

      const authData = await loginWithGoogle(response.credential);

      localStorage.setItem("token", authData.access_token);

      const user = await getCurrentUser(authData.access_token);

      saveUser(user);

      navigate(redirectByRole(user.role));
    } catch (error) {
      console.error("Google login error:", error);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (window.google && hiddenGoogleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(hiddenGoogleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: "300",
      });
    } else {
      console.error("🔴 window.google n'est pas disponible !");
    }
  }, []);

  const handleGoogleClick = () => {
    const realGoogleButton = hiddenGoogleBtnRef.current?.querySelector('div[role="button"]');
    console.log("🔵 Bouton Google trouvé:", realGoogleButton);
    if (realGoogleButton) {
      realGoogleButton.click();
    } else {
      console.error("🔴 Bouton Google caché introuvable !");
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
        </div>

        <button
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
          onClick={async () => {
            try {
              if (!validateForm()) return;

              const authData = await login(email, password);
              localStorage.setItem("token", authData.access_token);

              const user = await getCurrentUser(authData.access_token);
              saveUser(user);

              navigate(redirectByRole(user.role));
            } catch (error) {
              console.error("Login error:", error);
              alert(error.message);
            }
          }}
        >
          Login
        </button>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div
          ref={hiddenGoogleBtnRef}
          style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, overflow: "hidden" }}
        ></div>

        <button
          onClick={handleGoogleClick}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-200 shadow-sm"
        >
          <FcGoogle className="w-5 h-5" />
          Continue with Google
        </button>
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