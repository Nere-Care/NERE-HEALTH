import {
  HeartPulse,
  Stethoscope,
  BriefcaseMedical,
  User,
  Mail,
  Phone,
} from "lucide-react";

import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import RoleCard from "../../../components/form/RoleCard";

export default function SignupStep1({
  selectedRole,
  setSelectedRole,
  handleNext,
  resetToLogin,
  prenom,
  setPrenom,
  nom,
  setNom,
  email,
  setEmail,
  telephone,
  setTelephone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
}) {
  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        {/* ================= ROLES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
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
        {errors.role && <p className="text-red-500 text-xs mb-4 ml-2">{errors.role}</p>}

        {/* ================= FORM ================= */}
        <div className="space-y-4">

          <Input
            icon={<User className="w-5 h-5 text-gray-500" />}
            placeholder="First Name"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            error={errors.prenom}
          />

          <Input
            icon={<User className="w-5 h-5 text-gray-500" />}
            placeholder="Last Name"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            error={errors.nom}
          />

          <Input
            icon={<Mail className="w-5 h-5 text-gray-500" />}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            icon={<Phone className="w-5 h-5 text-gray-500" />}
            placeholder="6XX XXX XXX"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            maxLength={9}
            pattern="6[0-9]{8}"
            error={errors.telephone}
          />

          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <PasswordInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
        </div>

        {/* ================= BUTTON ================= */}
        <button
          onClick={handleNext}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100"
        >
          Next
        </button>
      </div>

      {/* ================= LOGIN LINK ================= */}
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
  );
}