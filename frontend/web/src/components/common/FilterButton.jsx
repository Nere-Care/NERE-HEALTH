import { SlidersHorizontal } from "lucide-react";

export default function FilterButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-3 border rounded-xl hover:bg-gray-50 transition"
    >
      <SlidersHorizontal className="w-5 h-5" />
      <span>Filter</span>
    </button>
  );
}