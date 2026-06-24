import {
  HeartPulse,
  Stethoscope,
  BriefcaseMedical,
  User,
  Mail,
} from "lucide-react";

import Input from "../../../components/form/Input";
import PasswordInput from "../../../components/form/PasswordInput";
import RoleCard from "../../../components/form/RoleCard";

export default function SignupStep1({
  handleNext,
  resetToLogin,
    updateForm,
    formData,
}) {
  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        {/* ================= ROLES ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <RoleCard
           active={formData.role === "patient"}
           onClick={() => updateForm("role", "patient")}
           icon={<HeartPulse className="w-7 h-7" />}
           text="I am a Patient"
          />

          <RoleCard
            active={formData.role === "doctor"}
            onClick={() => updateForm("role", "doctor")}
            icon={<Stethoscope className="w-7 h-7" />}
            text="I am a Doctor"
          />

          <RoleCard
            active={formData.role === "nurse"}
            onClick={() => updateForm("role", "nurse")}
            icon={<BriefcaseMedical className="w-7 h-7" />}
            text="I am a Nurse"
          />
        </div>

        {/* ================= FORM ================= */}
        <div className="space-y-4">

          <Input
          icon={<User className="w-5 h-5 text-gray-500" />}
          placeholder="First Name"
          value={formData.firstName}
          onChange={(e) => updateForm("firstName", e.target.value)}
          />

          <Input
            icon={<User className="w-5 h-5 text-gray-500" />}
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => updateForm("lastName", e.target.value)}
          />

          <Input
            icon={<Mail className="w-5 h-5 text-gray-500" />}
            placeholder="Email"
            value={formData.email}
            type="email"
            onChange={(e) => updateForm("email", e.target.value)}
          />

          <PasswordInput placeholder="Password" value={formData.password} onChange={(e) => updateForm("password", e.target.value)} />

          <PasswordInput placeholder="Confirm Password" value={formData.confirmPassword} onChange={(e) => updateForm("confirmPassword", e.target.value)} />
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