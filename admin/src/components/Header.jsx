import {
  Bell,
  Sun,
  Moon,
  Settings,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { connectNotifStream, disconnectNotifStream, onNotification } from "../services/notifStream";

export default function Header({
  titre = "Administration Panel",
  darkMode,
  setDarkMode,
  collapsed,
}) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await API.get("/notifications", { params: { limit: 100 } });
      const list = Array.isArray(res.data) ? res.data : [];
      setUnreadCount(list.filter((n) => n.statut !== "lu").length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    connectNotifStream();
    const unsubscribe = onNotification(() => {
      fetchUnreadCount();
    });
    return () => {
      unsubscribe();
      disconnectNotifStream();
    };
  }, [fetchUnreadCount]);

  return (
    <header
      className={`
        fixed z-40
        top-16 md:top-0
        right-0

        transition-all duration-300

        ${
          collapsed
            ? "md:left-20"
            : "md:left-64"
        }

        left-0

        ${
          darkMode
            ? "bg-gray-900 border-b border-gray-800"
            : "bg-white border-b border-gray-200"
        }
      `}
    >
      <div
        className="
          h-16
          px-3 sm:px-4 md:px-6
          flex items-center justify-between
          gap-4
        "
      >
        {/* ================= LEFT ================= */}

        <div className="flex items-center min-w-0 flex-1">
          <div className="min-w-0">
            <h1
              className={`
                text-sm sm:text-lg md:text-xl
                font-bold truncate
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }
              `}
            >
              {titre}
            </h1>

            <p
              className={`
                hidden sm:block
                text-xs mt-0.5 truncate
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
        </div>

        {/* ================= RIGHT ================= */}

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* DARK MODE */}

          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }
            className={`
              relative w-12 h-6 rounded-full transition-all

              ${
                darkMode
                  ? "bg-blue-600"
                  : "bg-gray-300"
              }
            `}
          >
            <div
              className={`
                absolute top-0.5
                w-5 h-5 rounded-full bg-white
                flex items-center justify-center
                transition-all duration-300

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
            onClick={() =>
              navigate("/notifications")
            }
            className={`
              relative p-2 rounded-xl transition

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

            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* SETTINGS */}

          <button
            onClick={() =>
              navigate("/settings")
            }
            className={`
              p-2 rounded-xl transition

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

          {/* PROFILE */}

          <div
            onClick={() =>
              navigate("/settings")
            }
            className={`
              flex items-center gap-2 md:gap-3
              cursor-pointer rounded-2xl
              px-2 py-1.5 transition

              ${
                darkMode
                  ? "hover:bg-gray-800"
                  : "hover:bg-gray-100"
              }
            `}
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                A
              </span>
            </div>

            <div className="hidden lg:block">
              <p
                className={`
                  text-sm font-medium leading-none
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
                className={`
                  text-xs mt-1
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
      </div>
    </header>
  );
}