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
  const [inscriptionEnAttente, setInscriptionEnAttente] = useState(false);
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
    setInscriptionEnAttente(false);   // ← ligne manquante, c'est le bug exact

  };

  // ============================================
  // CONNEXION
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
      const authData = await login(formData.email, formData.password);
      localStorage.setItem("token", authData.access_token);

      const user = await getCurrentUser(authData.access_token);
      saveUser(user);

      navigate(redirectByRole(user.role));
    } catch (error) {
      console.error("❌ Login error:", error);
      setGlobalError(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INSCRIPTION ETAPE 1 → ETAPE 2
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
  // INSCRIPTION ETAPE 2 → ETAPE 3 (ou SOUMISSION pour patient)
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
  // INSCRIPTION FINALE
  // ============================================
  const encoderFichiers = async (files) => {
    if (!files || files.length === 0) return [];
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                nom_fichier: file.name,
                mime_type: file.type,
                contenu_base64: reader.result.split(",")[1],
              });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
  };

  const handleSubmit = async () => {
    const validationErrors = stepThree
      ? validateSignupStep3(formData)
      : validateSignupStep2(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setGlobalError(null);

      localStorage.setItem("role", formData.role);

      const documentsEncodes =
        formData.role !== "patient" && formData.files?.length > 0
          ? await encoderFichiers(formData.files)
          : [];

      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        prenom: formData.firstName.trim(),
        nom: formData.lastName.trim(),
        telephone: formData.telephone || null,
        role: formData.role,
        city: formData.city || null,
        district: formData.district || null,
        dob: formData.dob || null,
        experience: Number(formData.experience) || 0,
        hospital: formData.hospital || null,
        registration_number: formData.registrationNumber || null,
        speciality: formData.speciality || null,
        documents: documentsEncodes,
      };

      const user = await register(payload);

      if (formData.role === "doctor" || formData.role === "nurse") {
        setInscriptionEnAttente(true);
        return;
      }

      saveUser(user);
      const authData = await login(formData.email.trim(), formData.password).catch(() => null);
      if (authData?.access_token) {
        localStorage.setItem("token", authData.access_token);
        const me = await getCurrentUser(authData.access_token).catch(() => null);
        if (me) saveUser(me);
      }
      navigate(redirectByRole(formData.role));

    } catch (err) {
      setGlobalError(err.message || "Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F4F9FF] overflow-hidden">
      {/* CÔTÉ GAUCHE */}
      <div className="hidden lg:flex w-[45%] bg-[#EAF4FF] items-center justify-center p-10 border-r border-blue-100">
        <div className="max-w-xl">
          <img src={healthcare} alt="Santé" className="w-full object-contain rounded-3xl" />
          <div className="mt-8 text-center">
            <h2 className="text-4xl font-bold text-[#2F80ED] mb-4">Bienvenue sur Néré Health</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              Une plateforme numérique de santé moderne conçue pour simplifier les rendez-vous, la téléconsultation, le suivi des patients et la collaboration médicale.
            </p>
          </div>
        </div>
      </div>

      {/* CÔTÉ DROIT */}
      <div className="w-full lg:w-[55%] min-h-screen overflow-y-auto flex items-start lg:items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl sm:rounded-[32px] shadow-2xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10 my-4">

          {/* BARRE SUPÉRIEURE */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2F80ED]">Néré Health</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Plateforme de santé intelligente</p>
            </div>
            {!isLogin && (stepTwo || stepThree) && (
              <button
                onClick={handlePrevious}
                className="text-[#27AE60] text-xs sm:text-sm font-semibold hover:underline"
              >
                ← PRÉCÉDENT
              </button>
            )}
          </div>

          {/* TITRE */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2F80ED] mb-2">
              {isLogin ? "Connexion" : "Créer un compte"}
            </h2>
            <p className="text-gray-500 text-base sm:text-lg">
              {isLogin
                ? "Connectez-vous à votre compte"
                : stepThree
                ? "Ajoutez des informations complémentaires"
                : "Inscrivez-vous pour commencer"}
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

          {/* CHARGEMENT */}
          {loading && (
            <div className="mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 text-sm">
              <Loader2 size={18} className="animate-spin" />
              <span>Traitement en cours...</span>
            </div>
          )}

          {/* CONNEXION / INSCRIPTION */}
          {inscriptionEnAttente ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Inscription enregistrée !</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Votre dossier est en cours de vérification par notre équipe. Vous recevrez un email
                dès que votre compte sera activé. Cela peut prendre jusqu'à 48h.
              </p>
              <button
                onClick={resetToLogin}
                className="mt-6 text-[#2F80ED] font-medium hover:underline text-sm"
              >
                Retour à la connexion
              </button>
            </div>
          ) : isLogin ? (
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