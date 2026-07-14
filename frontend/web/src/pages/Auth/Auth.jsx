import { useState } from "react";
import healthcare from "../../assets/healthcare.png";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

import { login, register, getCurrentUser } from "../../services/authService";
import LoginStep from "./steps/LoginStep";
import SignupStep1 from "./steps/SignupStep1";
import SignupStep2 from "./steps/SignupStep2";
import SignupStep3 from "./steps/SignupStep3";

import { hospitals } from "../../constants/medicalOptions";
import { validateLogin, validateSignupStep1, validateSignupStep2, validateSignupStep3 } from "../../utils/validation";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [stepTwo, setStepTwo] = useState(false);
  const [stepThree, setStepThree] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [globalSuccess, setGlobalSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    telephone: "",
    confirmPassword: "",
    city: "",
    district: "",
    speciality: "",
    dob: "",
    experience: 0,
    hospital: "",
    registrationNumber: "",
    files: [],
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    if (globalError) setGlobalError(null);
  };

  const saveUser = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  };

  const redirectByRole = (role) => {
    switch (role) {
      case "patient": return "/patient-dashboard";
      case "doctor":
      case "medecin": return "/doctor-dashboard";
      case "nurse": return "/nurse-dashboard";
      case "observer": return "/observer-dashboard";
      case "structure": return "/structure-dashboard";
      default: return "/";
    }
  };

  const handlePrevious = () => {
    if (stepThree) setStepThree(false);
    else if (stepTwo) setStepTwo(false);
    setErrors({});
  };

  const resetToLogin = () => {
    setIsLogin(true);
    setStepTwo(false);
    setStepThree(false);
    setErrors({});
    setGlobalError(null);
  };

 // ============================================
// LOGIN (CORRIGÉ)
// ============================================
const handleLogin = async () => {
  const validationErrors = validateLogin(formData.email, formData.password);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setLoading(true);
  setGlobalError(null);
  try {
    // 1️⃣ Récupérer le token
    const authData = await login(formData.email, formData.password);
    localStorage.setItem("token", authData.access_token);

    // 2️⃣ ✅ Récupérer les infos COMPLÈTES de l'utilisateur
    const user = await getCurrentUser(authData.access_token);
    console.log("✅ USER COMPLET:", user);

    // 3️⃣ Sauvegarder les infos complètes
    saveUser(user);

    // 4️⃣ Redirection selon le rôle
    navigate(redirectByRole(user.role));
  } catch (error) {
    console.error("❌ Login error:", error);
    setGlobalError(error.message || "Erreur de connexion");
  } finally {
    setLoading(false);
  }
};

  // ============================================
  // SIGNUP STEP 1 → STEP 2
  // ============================================
  const handleNext = () => {
    const validationErrors = validateSignupStep1(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStepTwo(true);
  };

  // ============================================
  // SIGNUP STEP 2 → STEP 3 (ou SUBMIT pour patient)
  // ============================================
  const handleStep2Next = () => {
    const validationErrors = validateSignupStep2(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    
    if (formData.role === "patient") {
      handleSubmit();
    } else {
      setStepThree(true);
    }
  };

// ============================================
// SIGNUP FINAL (CORRIGÉ)
// ============================================
const handleSubmit = async () => {
  let validationErrors = {};
  if (formData.role === "patient") {
    validationErrors = validateSignupStep2(formData);
  } else {
    validationErrors = validateSignupStep3(formData);
  }

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  setLoading(true);
  setGlobalError(null);
  setGlobalSuccess(null);

  try {
    const payload = {
      email: formData.email,
      password: formData.password,
      prenom: formData.firstName,
      nom: formData.lastName,
      telephone: formData.telephone || null,
      role: formData.role === "doctor" ? "medecin" : formData.role,
      city: formData.city || null,
      district: formData.district || null,
      dob: formData.dob || null,
      experience: formData.experience || 0,
      hospital: formData.hospital || null,
      registration_number: formData.registrationNumber || null,
    };

    // 1️⃣ Créer le compte
    const registerResponse = await register(payload);
    setGlobalSuccess("Compte créé avec succès ! Connexion en cours...");

    // 2️⃣ Se connecter pour obtenir le token
    const loginResponse = await login(formData.email, formData.password);
    localStorage.setItem("token", loginResponse.access_token);

    // 3️⃣ ✅ Récupérer les infos COMPLÈTES de l'utilisateur
    const user = await getCurrentUser(loginResponse.access_token);
    console.log("✅ USER COMPLET après inscription:", user);

    // 4️⃣ Sauvegarder les infos complètes
    saveUser(user);

    // 5️⃣ Redirection
    setTimeout(() => {
      navigate(redirectByRole(user.role || formData.role));
    }, 1000);

  } catch (error) {
    console.error("❌ Signup error:", error);
    setGlobalError(error.message || "Erreur lors de l'inscription");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex bg-[#F4F9FF] overflow-hidden">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-[45%] bg-[#EAF4FF] items-center justify-center p-10 border-r border-blue-100">
        <div className="max-w-xl">
          <img src={healthcare} alt="Healthcare" className="w-full object-contain rounded-3xl" />
          <div className="mt-8 text-center">
            <h2 className="text-4xl font-bold text-[#2F80ED] mb-4">Welcome to Néré Health</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              A modern digital healthcare platform designed to simplify appointments, teleconsultation, patient monitoring and medical collaboration.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-[55%] min-h-screen overflow-y-auto flex items-start lg:items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl sm:rounded-[32px] shadow-2xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10 my-4">

          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2F80ED]">Néré Health</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Smart Healthcare Platform</p>
            </div>
            {!isLogin && (stepTwo || stepThree) && (
              <button
                onClick={handlePrevious}
                className="text-[#27AE60] text-xs sm:text-sm font-semibold hover:underline"
              >
                ← PREVIOUS
              </button>
            )}
          </div>

          {/* TITLE */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2F80ED] mb-2">
              {isLogin ? "Login" : "Create Account"}
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">
              {isLogin
                ? "Sign in to your account"
                : stepThree
                ? "Add more information"
                : "Sign up to get started"}
            </p>
          </div>

          {/* MESSAGES GLOBAUX */}
          {globalError && (
            <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{globalError}</span>
            </div>
          )}
          {globalSuccess && (
            <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{globalSuccess}</span>
            </div>
          )}

          <div className="border-t border-gray-200 mb-6 sm:mb-8"></div>

          {/* LOADING OVERLAY */}
          {loading && (
            <div className="mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 text-sm">
              <Loader2 size={18} className="animate-spin" />
              <span>Traitement en cours...</span>
            </div>
          )}

          {/* LOGIN */}
          {isLogin ? (
            <LoginStep
              email={formData.email}
              password={formData.password}
              setEmail={(val) => updateForm("email", val)}
              setPassword={(val) => updateForm("password", val)}
              navigate={navigate}
              saveUser={saveUser}
              redirectByRole={redirectByRole}
              setIsLogin={setIsLogin}
              errors={errors}
              setErrors={setErrors}
              loading={loading}
              onLogin={handleLogin}
            />
          ) : (
            <>
              {!stepTwo && !stepThree && (
                <SignupStep1
                  handleNext={handleNext}
                  resetToLogin={resetToLogin}
                  updateForm={updateForm}
                  formData={formData}
                  errors={errors}
                  loading={loading}
                />
              )}
              {stepTwo && !stepThree && (
                <SignupStep2
                  saveUser={saveUser}
                  navigate={navigate}
                  redirectByRole={redirectByRole}
                  setStepThree={setStepThree}
                  updateForm={updateForm}
                  formData={formData}
                  handleSubmit={handleStep2Next}
                  errors={errors}
                  loading={loading}
                />
              )}
              {stepThree && (
                <SignupStep3
                  hospitals={hospitals}
                  handleSubmit={handleSubmit}
                  resetToLogin={resetToLogin}
                  updateForm={updateForm}
                  formData={formData}
                  errors={errors}
                  loading={loading}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}