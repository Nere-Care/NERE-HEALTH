import { useState } from "react";
import healthcare from "../../assets/healthcare.png";
import { useNavigate } from "react-router-dom";

import {
  Mail,
  User,
  HeartPulse,
  Stethoscope,
  BriefcaseMedical,
  FileText,
} from "lucide-react";

import {login} from "../../services/authService"

import Input from "../../components/form/Input";
import PasswordInput from "../../components/form/PasswordInput";
import SelectInput from "../../components/form/SelectInput";
import DateInput from "../../components/form/DateInput";
import { register } from "../../services/authService";
import LoginStep from "./steps/LoginStep";
import SignupStep1 from "./steps/SignupStep1";
import SignupStep2 from "./steps/SignupStep2";
import SignupStep3 from "./steps/SignupStep3";

import {
  doctorSpecialities,
  nurseSpecialities,
  cities,
  districts,
  hospitals,
} from "../../constants/medicalOptions";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [stepTwo, setStepTwo] = useState(false);
  const [stepThree, setStepThree] = useState(false);
  const [experience, setExperience] = useState(0);
  const [errors, setErrors] = useState({});
 

  const navigate = useNavigate();

  const saveUser = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  };



  const handlePrevious = () => {
    if (stepThree) {
      setStepThree(false);
    } else if (stepTwo) {
      setStepTwo(false);
    }
  };

  const resetToLogin = () => {
    setIsLogin(true);
    setStepTwo(false);
    setStepThree(false);
  };

const handleSubmit = async () => {
   alert("HANDLE SUBMIT EXECUTE");

  console.log("HANDLE SUBMIT EXECUTE");
  try {
 const payload = {
  email: formData.email,
  password: formData.password,
  prenom: formData.firstName,
  nom: formData.lastName,
  telephone: formData.telephone || null,
  role: formData.role,
  city: formData.city || null,
  district: formData.district || null,
  dob: formData.dob || null,
  experience: formData.experience || 0,
  hospital: formData.hospital || null,
  registration_number: formData.registrationNumber || null,
};

    console.log("📤 REGISTER PAYLOAD FINAL:", payload);

    const response = await register(payload);

    console.log("📥 REGISTER RESPONSE:", response);


// Connexion automatique après inscription
const loginResponse = await login(formData.email, formData.password);

localStorage.setItem("token", loginResponse.access_token);

saveUser(response);


navigate(redirectByRole(response.role || formData.role));

  } catch (error) {
    console.error("❌ Signup error:", error);
    setErrors({ api: error.message });
  }
};

const validateForm = () => {
  const newErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!formData.email) {
  newErrors.email = "Email requis";
} else if (!emailRegex.test(formData.email)) {
  newErrors.email = "Email invalide";
}

  if (!formData.password || formData.password.length < 6) {
    newErrors.password = "Mot de passe (min 6 caractères)";
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


const validateLogin = () => {
  const newErrors = {};

  if (!formData.email) {
    newErrors.email = "Email requis";
  }

  if (!formData.password) {
    newErrors.password = "Mot de passe requis";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const validateRegister = () => {
  const newErrors = {};

  if (!formData.email) {
    newErrors.email = "Email requis";
  }

  if (!formData.password || formData.password.length < 6) {
    newErrors.password = "Mot de passe trop court";
  }

  if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword =
      "Les mots de passe ne correspondent pas";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const handleNext = () => {
  if (!formData.role) return;

  if (
    !formData.firstName ||
    !formData.lastName ||
    !formData.email ||
    !formData.password ||
    !formData.confirmPassword
  ) {
    return;
  }

  if (!validateRegister()) return;

  setStepTwo(true);
};


const redirectByRole = (role) => {
  switch (role) {
    case "patient":
      return "/patient-dashboard";
    case "doctor":
    case "medecin":
      return "/doctor-dashboard";
    case "nurse":
    case "medecin":
      return "/nurse-dashboard";
    case "observer":
      return "/observer-dashboard";
    case "structure":
      return "/structure-dashboard";
    default:
      return "/";
  }
};

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
  files: []
});
const updateForm = (field, value) => {
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
};

  return (
    <div className="min-h-screen flex bg-[#F4F9FF] overflow-hidden">

      {/* ================= LEFT SIDE ================= */}
      <div className="hidden lg:flex w-[45%] bg-[#EAF4FF] items-center justify-center p-10 border-r border-blue-100">

        <div className="max-w-xl">
          <img
            src={healthcare}
            alt="Healthcare"
            className="w-full object-contain rounded-3xl"
          />

          <div className="mt-8 text-center">
            <h2 className="text-4xl font-bold text-[#2F80ED] mb-4">
              Welcome to Néré Health
            </h2>

            <p className="text-gray-600 leading-relaxed text-lg">
              A modern digital healthcare platform designed to simplify
              appointments, teleconsultation, patient monitoring and medical
              collaboration.
            </p>
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE ================= */}
      <div className="w-full lg:w-[55%] min-h-screen overflow-y-auto flex items-start lg:items-center justify-center px-4 sm:px-6 py-6 sm:py-10">

        {/* ================= AUTH CARD ================= */}
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl sm:rounded-[32px] shadow-2xl px-4 sm:px-6 lg:px-10 py-6 sm:py-10 my-4">

          {/* ================= TOP BAR ================= */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#2F80ED]">
                Néré Health
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Smart Healthcare Platform
              </p>
            </div>

            {!isLogin && (stepTwo || stepThree) && (
              <button
                onClick={handlePrevious}
                className="text-[#27AE60] text-xs sm:text-sm font-semibold hover:underline"
              >
                PREVIOUS
              </button>
            )}
          </div>

          {/* ================= TITLE ================= */}
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

          {/* DELIMITER */}
          <div className="border-t border-gray-200 mb-6 sm:mb-8"></div>

          {/* ================= LOGIN ================= */}
          {isLogin ? (
            <>
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
                validateForm={validateLogin}
              />
            </>
          ) : (
            <>
              {/* ================= STEP 1 ================= */}
              {!stepTwo && !stepThree && (
                <SignupStep1
                  handleNext={handleNext}
                  resetToLogin={resetToLogin}
                  updateForm={updateForm}
                  formData={formData}
                />
              )}

              {/* ================= STEP 2 ================= */}
              {stepTwo && !stepThree && (
                <SignupStep2
                  saveUser={saveUser}
                  navigate={navigate}
                  redirectByRole={redirectByRole}
                  setStepThree={setStepThree}
                  updateForm={updateForm}
                  formData={formData}
                  handleSubmit={handleSubmit}
                />
              )}

              {/* ================= STEP 3 ================= */}
              {stepThree && (
                <SignupStep3
                  hospitals={hospitals}
                  experience={experience}
                  setExperience={setExperience}
                  handleSubmit={handleSubmit}
                  resetToLogin={resetToLogin}
                  updateForm={updateForm}
                  formData={formData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}