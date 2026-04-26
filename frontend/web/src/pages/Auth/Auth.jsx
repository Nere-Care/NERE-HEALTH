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
  const navigate = useNavigate();

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
  navigate("/appointments");
  };

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* LEFT SIDE */}
      <div className="hidden md:flex w-1/2 bg-white">
        <img
          src={healthcare}
          alt="Healthcare"
          className="w-full h-screen object-cover"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 h-screen overflow-y-auto bg-white">
        <div className="w-full px-6 sm:px-6 lg:px-15 py-10">

          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-8">
            <img src="" alt="Logo" className="w-32" />

            {!isLogin && (stepTwo || stepThree) && (
              <button
                onClick={handlePrevious}
                className="text-[#27AE60] text-sm font-semibold hover:underline"
              >
                PREVIOUS
              </button>
            )}
          </div>

          {/* TITLE */}
          <h2 className="text-3xl font-bold text-[#2F80ED] mb-1">
            {isLogin ? "Login" : "Create Account"}
          </h2>

          <p className="text-xl font-light text-[#1F2937] mb-12">
            {isLogin
              ? "Sign in to your account"
              : stepThree
              ? "Add more information"
              : "Sign up to get started"}
          </p>

          {/* ================= LOGIN ================= */}
          {isLogin ? (
            <>
              <div className="space-y-6">
                <Input
                  icon={<Mail className="w-5 h-5 text-gray-500" />}
                  placeholder="Email"
                  type="email"
                />

                <PasswordInput placeholder="Password" />
              </div>

              <p className="text-sm mt-10 text-gray-600">
                Don’t have an account yet?{" "}
                <span
                  onClick={() => setIsLogin(false)}
                  className="text-[#2F80ED] cursor-pointer"
                >
                  Sign up
                </span>
              </p>

              <button className="w-full bg-[#2F80ED] mt-3 text-white p-3 rounded-lg hover:bg-[#044EC8] transition">
                Login
              </button>

              <div className="flex items-center my-10">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <button className="w-full flex items-center justify-center gap-3 bg-[rgba(217,218,220,0.1)] text-gray-800 p-3 rounded-lg hover:bg-[rgba(217,218,220,0.25)] transition border border-gray-200">
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>
            </>
          ) : (
            <>
              {/* ================= STEP 1 ================= */}
              {!stepTwo && !stepThree && (
                <>
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

                  <p className="text-sm mt-8 text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer"
                    >
                      Login
                    </span>
                  </p>

                  <button
                    onClick={handleNext}
                    className="w-full bg-[#2F80ED] mt-3 text-white p-3 rounded-lg"
                  >
                    Next
                  </button>
                </>
              )}

              {/* ================= STEP 2 ================= */}
              {stepTwo && !stepThree && (
                <>
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

                  <p className="text-sm mt-8 text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer"
                    >
                      Login
                    </span>
                  </p>

                  {selectedRole === "patient" ? (
                    <button className="w-full bg-[#2F80ED] mt-3 text-white p-3 rounded-lg">
                      Sign Up
                    </button>
                  ) : (
                    <button
                      onClick={handleSignUp}
                      className="w-full bg-[#2F80ED] mt-3 text-white p-3 rounded-lg"
                    >
                      Sign Up
                    </button>
                  )}
                </>
              )}

              {/* ================= STEP 3 ================= */}
              {stepThree && (
                <>
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
                      <p className="text-sm text-gray-600 mb-3">
                        Degree and certification (Pdf, Jpg, PNG)
                      </p>

                      <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl p-6 text-center">
                        <FileText className="w-20 h-20 mx-auto text-gray-400 mb-3" />

                        <label className="inline-block bg-[#2F80ED] text-white px-16 py-2 rounded-lg cursor-pointer">
                          Choose File
                          <input type="file" hidden multiple />
                        </label>
                      </div>

                      <p className="text-sm text-[#B97A2B] mt-3">
                        The file must be readable and authentic
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mt-8 text-gray-600">
                    Already have an account?{" "}
                    <span
                      onClick={resetToLogin}
                      className="text-[#2F80ED] cursor-pointer"
                    >
                      Login
                    </span>
                  </p>

                  <button
                   onClick={handleSubmit}
                   className="w-full bg-[#2F80ED] mt-3 text-white p-3 rounded-lg">
                    Submit
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}