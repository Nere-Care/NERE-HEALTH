import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SelectInput({ placeholder, options = [], value, onChange }) {
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="
      relative
      border border-gray-200
      rounded-2xl
      bg-white
      overflow-hidden
      shadow-sm
      hover:border-[#2F80ED]
      focus-within:border-[#2F80ED]
      transition-all
    ">
      <select
        value={currentValue}
        onChange={handleChange}
        className="
          w-full
          px-4 py-4
          pr-14
          bg-transparent
          outline-none
          appearance-none
          cursor-pointer
          text-gray-700
        "
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

      <div className="
        absolute top-0 right-0
        h-full w-14
        bg-[#27AE60]
        flex items-center justify-center
        pointer-events-none
      ">
        <ChevronDown className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}