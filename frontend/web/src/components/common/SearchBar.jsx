import { Search } from "lucide-react";

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
}) {
  return (
    <div className="relative w-full sm:w-[320px]">

      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#27772B]"
      />

    </div>
  );
}