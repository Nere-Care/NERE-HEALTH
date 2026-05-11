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
              {/* FORM CARD */}
              <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

                <div className="space-y-5">
                  <Input
                    icon={<Mail className="w-5 h-5 text-gray-500" />}
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </p>
                  )}

                  <PasswordInput
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </p>
                  )}
                </div>

                <button className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"   onClick={() => {
  if (!validateForm()) return;

  const user = {
    email,
    role: "structure",
  };

  saveUser(user);
  navigate(redirectByRole(user.role));
}} >
                  Login
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
                Don’t have an account yet?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
                >
                  Sign up
                </span>
              </p>
            </>
          ) : (
            <>
              {/* ================= STEP 1 ================= */}
              {!stepTwo && !stepThree && (
                <>
                  <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                      <RoleCard
                        active={selectedRole === "patient"}
                        onClick={() => setSelectedRole("patient")}
                        icon={<HeartPulse className="w-7 h-7" />}
                        text="I am a Patient"
                      />

                      <RoleCard
                        active={selectedRole === "doctor"}
                        onClick={() => setSelectedRole("doctor")}
                        icon={<Stethoscope className="w-7 h-7" />}
                        text="I am a Doctor"
                      />

                      <RoleCard
                        active={selectedRole === "nurse"}
                        onClick={() => setSelectedRole("nurse")}
                        icon={<BriefcaseMedical className="w-7 h-7" />}
                        text="I am a Nurse"
                      />
                    </div>

                    <div className="space-y-4">
                      <Input
                        icon={<User className="w-5 h-5 text-gray-500" />}
                        placeholder="First Name"
                      />

                      <Input
                        icon={<User className="w-5 h-5 text-gray-500" />}
                        placeholder="Last Name"
                      />

                      <Input
                        icon={<Mail className="w-5 h-5 text-gray-500" />}
                        placeholder="Email"
                        type="email"
                      />

                      <PasswordInput placeholder="Password" />

                      <PasswordInput placeholder="Confirm Password" />
                    </div>

                    <button
                      onClick={handleNext}
                      className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
                    >
                      Next
                    </button>
                  </div>

                  <p className="text-sm mt-8 text-center text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
                    >
                      Login
                    </span>
                  </p>
                </>
              )}

              {/* ================= STEP 2 ================= */}
              {stepTwo && !stepThree && (
                <>
                  <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

                    <div className="space-y-5">

                      <SelectInput
                        placeholder="Select City"
                        options={cities}
                      />

                      <SelectInput
                        placeholder="Select District"
                        options={districts}
                      />

                      {selectedRole === "patient" && <DateInput />}

                      {selectedRole === "doctor" && (
                        <>
                          <SelectInput
                            placeholder="Select Speciality"
                            options={doctorSpecialities}
                          />

                          <DateInput />
                        </>
                      )}

                      {selectedRole === "nurse" && (
                        <>
                          <SelectInput
                            placeholder="Select Speciality"
                            options={nurseSpecialities}
                          />

                          <DateInput />
                        </>
                      )}
                    </div>

                    {selectedRole === "patient" ? (
                      <button className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"  onClick={() => {
  const user = {
    role: selectedRole, // patient / doctor / nurse
    email: "user@email.com",
  };

  saveUser(user);
  navigate(redirectByRole(user.role));
}}>
                        Sign Up
                      </button>
                    ) : (
                      <button
                        onClick={handleSignUp}
                        className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
                      >
                        Continue
                      </button>
                    )}
                  </div>

                  <p className="text-sm mt-8 text-center text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
                    >
                      Login
                    </span>
                  </p>
                </>
              )}

              {/* ================= STEP 3 ================= */}
              {stepThree && (
                <>
                  <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

                    <div className="space-y-5">

                      <SelectInput
                        placeholder="Select Health Structure"
                        options={hospitals}
                      />

                      <Input
                        icon={<User className="w-5 h-5 text-gray-500" />}
                        placeholder="Professional Registration Number"
                      />

                      <ExperienceInput
                        value={experience}
                        setValue={setExperience}
                      />

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Degree and certification (Pdf, Jpg, PNG)
                        </p>

                        <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-8 text-center">

                          <FileText className="w-20 h-20 mx-auto text-blue-300 mb-4" />

                          <label className="inline-block bg-[#2F80ED] hover:bg-[#044EC8] transition text-white px-10 py-3 rounded-xl cursor-pointer font-medium shadow-md">
                            Choose File
                            <input type="file" hidden multiple />
                          </label>

                          <p className="text-sm text-gray-500 mt-4">
                            Upload your certifications and professional
                            documents
                          </p>
                        </div>

                        <p className="text-sm text-[#B97A2B] mt-3">
                          The file must be readable and authentic
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmit}
                      className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
                    >
                      Submit
                    </button>
                  </div>

                  <p className="text-sm mt-8 text-center text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer font-medium hover:underline"
                    >
                      Login
                    </span>
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}