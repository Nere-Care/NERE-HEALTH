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

import { FcGoogle } from "react-icons/fc";

import Input from "../../components/form/Input";
import PasswordInput from "../../components/form/PasswordInput";
import SelectInput from "../../components/form/SelectInput";
import DateInput from "../../components/form/DateInput";
import ExperienceInput from "../../components/form/ExperienceInput";
import RoleCard from "../../components/form/RoleCard";

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
  const [selectedRole, setSelectedRole] = useState("");
  const [stepTwo, setStepTwo] = useState(false);
  const [stepThree, setStepThree] = useState(false);
  const [experience, setExperience] = useState(0);
  const [errors, setErrors] = useState({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const saveUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
};

  const handleNext = () => {
    if (selectedRole) setStepTwo(true);
  };

  const handleSignUp = () => {
    if (selectedRole === "doctor" || selectedRole === "nurse") {
      setStepThree(true);
    }
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
    setSelectedRole("");
  };

const handleSubmit = () => {
  const user = {
    role: selectedRole,
    experience,
  };

  saveUser(user);
  navigate(redirectByRole(selectedRole));
};

const validateForm = () => {
  const newErrors = {};


  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  newErrors.email = "Email invalide";
}

  if (!password || password.length < 6) {
    newErrors.password = "Mot de passe (min 6 caractères)";
  }

  setErrors(newErrors);

  return Object.keys(newErrors).length === 0;
};

const redirectByRole = (role) => {
  switch (role) {
    case "patient":
      return "/patient-dashboard";
    case "doctor":
      return "/doctor-dashboard";
    case "nurse":
      return "/nurse-dashboard";
    case "observer":
      return "/observer-dashboard";
    case "structure":
      return "/structure-dashboard";
    default:
      return "/";
  }
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
      <div className="w-full lg:w-[55%] min-h-screen overflow-y-auto flex items-center justify-center px-6 py-10">

        {/* ================= AUTH CARD ================= */}
        <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-[32px] shadow-2xl px-6 sm:px-10 py-10">

          {/* ================= TOP BAR ================= */}
          <div className="flex items-center justify-between mb-8">

            <div>
              <h1 className="text-2xl font-bold text-[#2F80ED]">
                Néré Health
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Smart Healthcare Platform
              </p>
            </div>

            {!isLogin && (stepTwo || stepThree) && (
              <button
                onClick={handlePrevious}
                className="text-[#27AE60] text-sm font-semibold hover:underline"
              >
                PREVIOUS
              </button>
            )}
          </div>

          {/* ================= TITLE ================= */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-[#2F80ED] mb-2">
              {isLogin ? "Login" : "Create Account"}
            </h2>

            <p className="text-gray-500 text-lg">
              {isLogin
                ? "Sign in to your account"
                : stepThree
                ? "Add more information"
                : "Sign up to get started"}
            </p>
          </div>

          {/* DELIMITER */}
          <div className="border-t border-gray-200 mb-8"></div>

          {/* ================= LOGIN ================= */}
          {isLogin ? (
            <>
             <LoginStep
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              navigate={navigate}
              saveUser={saveUser}
              redirectByRole={redirectByRole}
              setIsLogin={setIsLogin}
              errors={errors}
              validateForm={validateForm}
            />
            </>
          ) : (
            <>
              {/* ================= STEP 1 ================= */}
              {!stepTwo && !stepThree && (
              <SignupStep1
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              handleNext={handleNext}
              resetToLogin={resetToLogin}
              />
              )}

              {/* ================= STEP 2 ================= */}
              {stepTwo && !stepThree && (
              <SignupStep2
              selectedRole={selectedRole}
              saveUser={saveUser}
              navigate={navigate}
              redirectByRole={redirectByRole}
              setStepThree={setStepThree}
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
              />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}