import { useState } from "react";
import { HeartPulse, Stethoscope, BriefcaseMedical, User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import RoleCard from "../../../components/form/RoleCard";
import { validateName, validateEmail, validatePassword, validateConfirmPassword, getPasswordStrength } from "../../../utils/validation";

export default function SignupStep1({ handleNext, resetToLogin, updateForm, formData, errors = {}, loading }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});

  const touch = (field) => setTouched(t => ({ ...t, [field]: true }));

  // Validations en temps réel
  const firstNameError = touched.firstName ? validateName(formData.firstName, "Prénom") : null;
  const lastNameError = touched.lastName ? validateName(formData.lastName, "Nom") : null;
  const emailError = touched.email ? validateEmail(formData.email) : null;
  const passwordError = touched.password ? validatePassword(formData.password) : null;
  const confirmPasswordError = touched.confirmPassword 
    ? validateConfirmPassword(formData.password, formData.confirmPassword) 
    : null;
  
  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = {
    gray: "bg-gray-200", red: "bg-red-500", orange: "bg-orange-500",
    yellow: "bg-yellow-500", green: "bg-green-500", emerald: "bg-emerald-500",
  };

  const inputClass = (error) => `w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition
    ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`;

  return (
    <>
      <div className="border border-gray-100 rounded-2xl bg-gray-50 p-6">
        {/* ROLES */}
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
        {errors.role && (
          <p className="text-red-500 text-xs mb-3 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.role}
          </p>
        )}

        {/* FORM */}
        <div className="space-y-4">
          {/* PRENOM */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                onBlur={() => touch("firstName")}
                className={inputClass(firstNameError || errors.firstName)}
              />
            </div>
            {(firstNameError || errors.firstName) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{firstNameError || errors.firstName}</p>
            )}
          </div>

          {/* NOM */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                onBlur={() => touch("lastName")}
                className={inputClass(lastNameError || errors.lastName)}
              />
            </div>
            {(lastNameError || errors.lastName) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{lastNameError || errors.lastName}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => updateForm("email", e.target.value)}
                onBlur={() => touch("email")}
                className={inputClass(emailError || errors.email)}
              />
            </div>
            {(emailError || errors.email) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{emailError || errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) => updateForm("password", e.target.value)}
                onBlur={() => touch("password")}
                className={`w-full pl-11 pr-11 py-3 rounded-xl border outline-none transition
                  ${passwordError || errors.password ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Indicateur de force */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition ${
                        i <= passwordStrength.score ? strengthColors[passwordStrength.color] : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {(passwordError || errors.password) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{passwordError || errors.password}</p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => updateForm("confirmPassword", e.target.value)}
                onBlur={() => touch("confirmPassword")}
                className={`w-full pl-11 pr-11 py-3 rounded-xl border outline-none transition
                  ${confirmPasswordError || errors.confirmPassword ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-blue-500"}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {(confirmPasswordError || errors.confirmPassword) && (
              <p className="text-red-500 text-xs mt-1 ml-1">{confirmPasswordError || errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* BOUTON */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-[#2F80ED] mt-6 text-white p-3 rounded-xl hover:bg-[#044EC8] transition font-medium shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {loading ? "Validation..." : "Next"}
        </button>
      </div>

      <p className="text-sm mt-8 text-center text-gray-600">
        Already have an account?{" "}
        <span onClick={resetToLogin} className="text-[#2F80ED] cursor-pointer font-medium hover:underline">
          Login
        </span>
      </p>
    </>
  );
}