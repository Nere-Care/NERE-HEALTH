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
  selectedRole,
  setSelectedRole,
  handleNext,
  resetToLogin,
}) {
  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">

        {/* ================= ROLES ================= */}
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

        {/* ================= FORM ================= */}
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