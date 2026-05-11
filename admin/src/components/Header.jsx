import {
  Bell,
  Sun,
  Moon,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function Header({
  titre = "Administration Panel",
  darkMode,
  setDarkMode,
  collapsed,
}) {
  const navigate = useNavigate();

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-16
      flex items-center justify-between
      px-4 md:px-6 transition-all duration-300

      ${
        collapsed
          ? "left-20"
          : "left-20 md:left-64"
      }

      ${
        darkMode
          ? "bg-gray-900/80 backdrop-blur-xl text-white border-b border-gray-800"
          : "bg-white/80 backdrop-blur-xl text-gray-800 border-b border-gray-100"
      }
    `}
    >
      {/* ================= LEFT ================= */}
      <div className="flex items-center gap-6 flex-1">

        {/* TITLE */}
        <div className="hidden sm:block">
          <h1 className="text-lg font-semibold tracking-tight">
            {titre}
          </h1>

          <p
            className={`text-xs mt-0.5
            ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }
          `}
          >
            Néré Health Administration
          </p>
        </div>

        {/* SEARCH */}
        <div
          className={`hidden lg:flex items-center flex-1 max-w-xl
          rounded-2xl px-4 py-2.5 transition-all

          ${
            darkMode
              ? "bg-gray-800/70 border border-gray-700"
              : "bg-gray-100/80 border border-gray-200"
          }
        `}
        >
          <Search
            size={17}
            className={
              darkMode
                ? "text-gray-500"
                : "text-gray-400"
            }
          />

          <input
            type="text"
            placeholder="Search patients, doctors..."
            className={`ml-3 w-full bg-transparent outline-none text-sm
            ${
              darkMode
                ? "placeholder:text-gray-500"
                : "placeholder:text-gray-400"
            }
          `}
          />
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* DARK MODE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`relative w-12 h-6 rounded-full transition-all
          ${
            darkMode
              ? "bg-blue-600"
              : "bg-gray-300"
          }
        `}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white
            flex items-center justify-center transition-all duration-300

            ${
              darkMode
                ? "right-0.5"
                : "left-0.5"
            }
          `}
          >
            {darkMode ? (
              <Moon
                size={11}
                className="text-blue-600"
              />
            ) : (
              <Sun
                size={11}
                className="text-yellow-500"
              />
            )}
          </div>
        </button>

        {/* NOTIFICATIONS */}
        <button
          onClick={() => navigate("/admin/notifications")}
          className={`relative p-2 rounded-xl transition
          ${
            darkMode
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }
        `}
        >
          <Bell
            size={19}
            className={
              darkMode
                ? "text-gray-300"
                : "text-gray-600"
            }
          />

          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* SETTINGS */}
        <button
          onClick={() => navigate("/admin/settings")}
          className={`p-2 rounded-xl transition
          ${
            darkMode
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }
        `}
        >
          <Settings
            size={19}
            className={
              darkMode
                ? "text-gray-300"
                : "text-gray-600"
            }
          />
        </button>

        {/* HELP */}
        <button
          onClick={() => navigate("/admin/help")}
          className={`p-2 rounded-xl transition
          ${
            darkMode
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }
        `}
        >
          <HelpCircle
            size={19}
            className={
              darkMode
                ? "text-gray-300"
                : "text-gray-600"
            }
          />
        </button>

        {/* PROFILE */}
        <div
          onClick={() => navigate("/admin/profile")}
          className={`flex items-center gap-3 cursor-pointer
          rounded-2xl px-2 py-1.5 transition

          ${
            darkMode
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }
        `}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-semibold">
              A
            </span>
          </div>

          <div className="hidden xl:block">
            <p
              className={`text-sm font-medium leading-none
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }
            `}
            >
              Admin
            </p>

            <p
              className={`text-xs mt-1
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            `}
            >
              Super Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}