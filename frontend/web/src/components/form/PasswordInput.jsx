import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function PasswordInput({  placeholder,
  value,
  onChange, }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="
        flex items-center
        bg-white
        border border-gray-200
        rounded-2xl
        overflow-hidden
        shadow-sm
        hover:border-[#2F80ED]
        focus-within:border-[#2F80ED]
        focus-within:ring-2
        focus-within:ring-blue-100
        transition-all duration-300
      "
    >
      {/* ICON LEFT */}
      <div className="pl-4">
        <Lock className="w-5 h-5 text-gray-400" />
      </div>

      {/* INPUT */}
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
          w-full
          bg-transparent
          outline-none
          px-3 py-4
          text-gray-700
          placeholder:text-gray-400
        "
      />

      {/* TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="
          h-full
          px-5
          py-5
          bg-[#27AE60]
          hover:bg-[#219150]
          flex items-center justify-center
          transition-all duration-300
        "
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5 text-white" />
        ) : (
          <Eye className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}