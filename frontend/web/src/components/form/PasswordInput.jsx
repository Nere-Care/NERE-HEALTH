import { Lock, Eye } from "lucide-react";

 export default function PasswordInput({ placeholder }) {
  return (
    <div className="flex items-center bg-[rgba(217,218,220,0.1)] border border-gray-300 rounded-lg overflow-hidden">
      <Lock className="w-5 h-5 text-gray-500 ml-3" />

      <input
        type="password"
        placeholder={placeholder}
        className="w-full outline-none bg-transparent px-2 py-3"
      />

      <div className="bg-[#27AE60] p-4 flex items-center justify-center cursor-pointer">
        <Eye className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}