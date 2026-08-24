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
import ForgotPasswordStep from "./steps/ForgotPasswordStep";
import CheckEmailStep from "./steps/CheckEmailStep";
import SignupStep1 from "./steps/SignupStep1";
import SignupStep2 from "./steps/SignupStep2";
import SignupStep3 from "./steps/SignupStep3";

import { register } from "../../services/auth";
import { post as postApi } from "../../services/apiClient";
import { validatePhone, phoneError } from "../../utils/validatePhone";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [checkEmailData, setCheckEmailData] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [stepTwo, setStepTwo] = useState(false);
  const [stepThree, setStepThree] = useState(false);
  const [experience, setExperience] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ville, setVille] = useState("");
  const [district, setDistrict] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [hopital, setHopital] = useState("");
  const [numeroOrdre, setNumeroOrdre] = useState("");
  const [presentation, setPresentation] = useState("");
  const [sexe, setSexe] = useState("");
  const [telephone, setTelephone] = useState("");
  const [documentsFiles, setDocumentsFiles] = useState([]);

  const navigate = useNavigate();

  const saveUser = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordUpper = /[A-Z]/;
  const passwordLower = /[a-z]/;
  const passwordSpecial = /[^a-zA-Z0-9]/;

  const handleNext = () => {
    const newErrors = {};
    if (!selectedRole) newErrors.role = "Veuillez sélectionner un rôle";
    if (!prenom.trim()) newErrors.prenom = "Prénom requis";
    if (!nom.trim()) newErrors.nom = "Nom requis";
    if (!email.trim()) {
      newErrors.email = "Email requis";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Email invalide";
    }
    if (!password) {
      newErrors.password = "Mot de passe requis";
    } else if (password.length < 8) {
      newErrors.password = "Min 8 caractères";
    } else if (!passwordUpper.test(password)) {
      newErrors.password = "Doit contenir une majuscule";
    } else if (!passwordLower.test(password)) {
      newErrors.password = "Doit contenir une minuscule";
    } else if (!passwordSpecial.test(password)) {
      newErrors.password = "Doit contenir un caractère spécial";
    }
    if (password !== confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (selectedRole === "doctor" || selectedRole === "nurse") {
      if (!telephone || !telephone.trim()) {
        newErrors.telephone = "Téléphone requis";
      } else if (!validatePhone(telephone)) {
        newErrors.telephone = phoneError();
      }
    } else if (telephone && !validatePhone(telephone)) {
      newErrors.telephone = phoneError();
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setStepTwo(true);
  };

  const sexeMap = {
    Masculin: "M",
    Féminin: "F",
    "Non précisé": "Non_precise",
  };

  const handlePatientSignUp = async () => {
    setLoading(true);
    setErrors({});
    try {
      const userData = {
        email,
        password,
        prenom,
        nom,
        telephone: telephone || undefined,
        sexe: sexeMap[sexe] || undefined,
        ville: ville || undefined,
        date_naissance: dateNaissance || undefined,
        adresse: [ville, district].filter(Boolean).join(', ') || undefined,
      };
      const data = await register(userData, "patient");
      setCheckEmailData({ email, ...data });
      setShowCheckEmail(true);
      setStepTwo(false);
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorNurseSignUp = async () => {
    setLoading(true);
    setErrors({});
    const newErrors = {};

    if (!hopital || !hopital.trim()) {
      newErrors.hopital = "Veuillez sélectionner ou ajouter votre structure de santé";
    }
    if (!numeroOrdre || !numeroOrdre.trim()) {
      newErrors.numeroOrdre = "Le numéro d'ordre est requis";
    }
    if (experience === undefined || experience === null || experience === "") {
      newErrors.experience = "Les années d'expérience sont requises";
    }
    if (!presentation || presentation.trim().length < 10) {
      newErrors.presentation = "La présentation de votre parcours est requise (min 10 caractères)";
    }
    if (!documentsFiles || documentsFiles.length === 0) {
      newErrors.documentsFiles = "Veuillez joindre votre pièce d'identité (CNI ou Passeport)";
    }
    if (!dateNaissance) {
      newErrors.dateNaissance = "La date de naissance est requise";
    } else {
      const birthDate = new Date(dateNaissance);
      if (isNaN(birthDate.getTime())) {
        newErrors.dateNaissance = "Date de naissance invalide";
      } else {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        if (age < 21) {
          newErrors.dateNaissance = "Vous devez avoir au moins 21 ans pour vous inscrire en tant que professionnel de santé";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email,
        password,
        prenom,
        nom,
        telephone: telephone || undefined,
        ville: ville || undefined,
        district: district || undefined,
        date_naissance: dateNaissance || undefined,
        specialites: specialite ? [specialite] : undefined,
        numero_ordre: numeroOrdre,
        annees_experience: experience,
        structure_nom: hopital || undefined,
        biographie: presentation || undefined,
        adresse: [ville, district].filter(Boolean).join(', ') || undefined,
      };
      const data = await register(userData, "medecin");

      if (data?.id && documentsFiles.length > 0) {
        for (const file of documentsFiles) {
          try {
            const formData = new FormData();
            formData.append("file", file);
            await postApi(`/api/medecins/${data.id}/documents/public-upload`, formData);
          } catch (err) {
            console.error("Erreur d'upload document lors de l'inscription :", err);
          }
        }
      }

      setCheckEmailData({ email, ...data });
      setShowCheckEmail(true);
      setStepThree(false);
      setStepTwo(false);
    } catch (err) {
      setErrors({ api: err.message });
    } finally {
      setLoading(false);
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
    setShowForgot(false);
    setShowCheckEmail(false);
    setCheckEmailData(null);
    setStepTwo(false);
    setStepThree(false);
    setSelectedRole("");
    setErrors({});
  };

  const handleSubmit = handleDoctorNurseSignUp;

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
      case "admin":
        return "http://localhost:4174";
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
              {showForgot
                ? "Mot de passe oublié"
                : showCheckEmail
                ? "Vérification de l'email"
                : isLogin
                ? "Login"
                : "Create Account"}
            </h2>

            <p className="text-gray-500 text-base sm:text-lg">
              {showForgot
                ? "Réinitialisez votre mot de passe"
                : showCheckEmail
                ? "Confirmez votre adresse email"
                : isLogin
                ? "Sign in to your account"
                : stepThree
                ? "Add more information"
                : "Sign up to get started"}
            </p>
          </div>

          {/* DELIMITER */}
          <div className="border-t border-gray-200 mb-6 sm:mb-8"></div>

          {/* ================= FORGOT PASSWORD ================= */}
          {showForgot ? (
            <ForgotPasswordStep setShowForgot={setShowForgot} />
          ) : showCheckEmail ? (
            <CheckEmailStep
              email={checkEmailData?.email}
              devData={checkEmailData}
              onBackToLogin={resetToLogin}
            />
          ) : isLogin ? (
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
                onForgotPassword={() => setShowForgot(true)}
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
                  prenom={prenom}
                  setPrenom={setPrenom}
                  nom={nom}
                  setNom={setNom}
                  email={email}
                  setEmail={setEmail}
                  telephone={telephone}
                  setTelephone={setTelephone}
                  password={password}
                  setPassword={setPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  errors={errors}
                />
              )}

              {/* ================= STEP 2 ================= */}
              {stepTwo && !stepThree && (
                <SignupStep2
                  selectedRole={selectedRole}
                  ville={ville}
                  setVille={setVille}
                  district={district}
                  setDistrict={setDistrict}
                  dateNaissance={dateNaissance}
                  setDateNaissance={setDateNaissance}
                  specialite={specialite}
                  setSpecialite={setSpecialite}
                  sexe={sexe}
                  setSexe={setSexe}
                  onPatientSignUp={handlePatientSignUp}
                  setStepThree={setStepThree}
                  loading={loading}
                  errors={errors}
                  setErrors={setErrors}
                />
              )}

              {/* ================= STEP 3 ================= */}
              {stepThree && (
                <SignupStep3
                  hopital={hopital}
                  setHopital={setHopital}
                  numeroOrdre={numeroOrdre}
                  setNumeroOrdre={setNumeroOrdre}
                  experience={experience}
                  setExperience={setExperience}
                  presentation={presentation}
                  setPresentation={setPresentation}
                  documentsFiles={documentsFiles}
                  setDocumentsFiles={setDocumentsFiles}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  errors={errors}
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