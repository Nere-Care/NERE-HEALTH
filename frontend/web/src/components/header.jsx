
import { Bell, Sun, Moon } from "lucide-react";


export default function Header({ titre, darkMode, setDarkMode, langue, setLangue }) {
  return (

    <div
      className={`
        fixed top-14 md:top-0 left-0 md:left-56 right-0 z-40
        flex items-center justify-between
        px-3 sm:px-4 md:px-6 py-3 md:py-4
        shadow-sm transition-colors
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}
      `}
    >


      {/* ================= TITLE ================= */}
      <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
        {titre}
      </h1>


      {/* ================= RIGHT SECTION ================= */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* ================= DARK MODE TOGGLE ================= */}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`
            w-12 sm:w-14 h-6 sm:h-7 rounded-full relative transition-all duration-300
            ${darkMode ? "bg-blue-600" : "bg-gray-200"}
          `}
        >
          <div
            className={`
              w-5 sm:w-6 h-5 sm:h-6 rounded-full absolute top-0.5
              flex items-center justify-center transition-all duration-300 bg-white
              ${darkMode ? "right-0.5" : "left-0.5"}
            `}
          >
            {darkMode ? (
              <Moon size={11} className="text-blue-600" />
            ) : (
              <Sun size={11} className="text-yellow-500" />
            )}
          </div>
        </button>

        {/* ================= NOTIFICATIONS ================= */}
        <div className="relative cursor-pointer">

          <Bell
            size={20}
            className={darkMode ? "text-gray-300" : "text-gray-600"}
          />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">

            3
          </span>
        </div>

        {/* ================= PROFILE ================= */}
        <div className="flex items-center gap-2 cursor-pointer">
          
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-xs sm:text-sm font-bold">
              M
            </span>
          </div>

          {/* Name (hidden on very small screens) */}
          <span
            className={`
              hidden sm:block text-xs sm:text-sm font-medium
              ${darkMode ? "text-white" : "text-gray-700"}
            `}
          >
            Mle agine
          </span>


        </div>

      </div>
    </div>
  );
}