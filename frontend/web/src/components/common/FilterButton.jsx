import { SlidersHorizontal } from "lucide-react";

export default function FilterButton({ onClick, darkMode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition
      ${
        darkMode
          ? "bg-gray-900 border-gray-700 text-gray-200 hover:bg-gray-800"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <SlidersHorizontal className="w-5 h-5" />
      <span>Filter</span>
    </button>
  );
}