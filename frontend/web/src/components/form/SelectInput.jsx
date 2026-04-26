import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SelectInput({ placeholder, options = [] }) {
  const [value, setValue] = useState("");

  return (
    <div className="relative border border-gray-300 rounded-lg bg-[rgba(217,218,220,0.1)] overflow-hidden">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full px-4 py-3 pr-14 bg-transparent outline-none appearance-none cursor-pointer text-gray-700"
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((item, index) => (
          <option key={index} value={item}>
            {item}
          </option>
        ))}
      </select>

      <div className="absolute top-0 right-0 h-full w-12 bg-[#27AE60] flex items-center justify-center pointer-events-none">
        <ChevronDown className="w-4 h-4 text-white" />
      </div>
    </div>
  );
}