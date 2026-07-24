import { useState } from "react";
import { Mail } from "lucide-react";
import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import { FcGoogle } from "react-icons/fc";
import { login } from "../../../services/auth";

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

        <button className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 p-3 rounded-xl hover:bg-gray-50 transition border border-gray-200 shadow-sm">
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