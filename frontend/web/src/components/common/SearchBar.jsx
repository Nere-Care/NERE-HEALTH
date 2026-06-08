import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  darkMode,
}) {
  return (
    <div className="relative w-full min-w-0">
      <Search
        className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
          darkMode ? "text-gray-400" : "text-gray-400"
        }`}
      />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full min-w-0 pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-xl outline-none focus:ring-2 transition ${
          darkMode
            ? "bg-gray-900 border-gray-700 text-white focus:ring-blue-500 placeholder-gray-500"
            : "bg-white border-gray-300 text-gray-800 focus:ring-[#27772B] placeholder-gray-400"
        }`}
      />
    </div>
  );
}