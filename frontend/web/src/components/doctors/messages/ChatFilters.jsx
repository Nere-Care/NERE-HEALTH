import { useState } from "react";

const filters = ["All", "Unread", "Doctors", "Patients", "Laboratory"];

export default function ChatFilters({ active, setActive, darkMode }) {
  return (
    <div
      className="
        flex gap-2 overflow-x-auto pb-2 px-1
        scroll-smooth
        scrollbar-none
      "
    >
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`
            px-2.5 sm:px-3
            py-1 sm:py-1.5
            rounded-full
            text-[10px] sm:text-xs
            whitespace-nowrap
            transition active:scale-95 flex-shrink-0

            ${active === f
              ? "bg-blue-600 text-white"
              : darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-200 text-gray-600"
            }
          `}
        >
          {f}
        </button>
      ))}
    </div>
  );
}