import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Eye,
  CreditCard,
  Calendar,
  MessageSquare,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },

  {
    icon: Users,
    label: "Patients",
    path: "/patients",
  },

  {
    icon: Stethoscope,
    label: "Professionnels",
    path: "/doctors",
  },

  {
    icon: Building2,
    label: "Structures",
    path: "/structures",
  },

  {
    icon: Eye,
    label: "Observator",
    path: "/observator",
  },

  {
    icon: Calendar,
    label: "Appointments",
    path: "/appointments",
  },

  {
    icon: CreditCard,
    label: "Payments",
    path: "/payments",
  },

  {
    icon: MessageSquare,
    label: "Conversations",
    path: "/conversations",
  },

  {
    icon: FileText,
    label: "Reports",
    path: "/reports",
  },
];

export default function sideBar({
  darkMode,
  collapsed,
  setCollapsed,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  return (
    <>
      {/* ================= MOBILE TOPBAR ================= */}

      <div
        className={`md:hidden fixed top-0 left-0 right-0 h-16 z-[60]
        flex items-center justify-between px-4 shadow-md
        ${
          darkMode
            ? "bg-gray-900 text-white border-b border-gray-800"
            : "bg-white text-gray-800 border-b border-gray-200"
        }`}
      >
        <h1 className="font-bold text-lg text-blue-600">
          Néré Admin
        </h1>

        <button
          onClick={() => setOpen(true)}
          className={`p-2 rounded-xl transition
          ${
            darkMode
              ? "hover:bg-gray-800"
              : "hover:bg-gray-100"
          }`}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ================= OVERLAY ================= */}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          flex flex-col justify-between
          transition-all duration-300 ease-in-out

          ${
            collapsed
              ? "md:w-20"
              : "md:w-64"
          }

          w-[85%] max-w-[300px]

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }

          ${
            darkMode
              ? "bg-gray-900 border-r border-gray-800"
              : "bg-white border-r border-gray-200"
          }
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* ================= HEADER ================= */}

          <div className="p-4 border-b border-inherit">
            {/* MOBILE CLOSE */}

            <div className="flex md:hidden items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">
                Menu
              </h2>

              <button
                onClick={() => setOpen(false)}
                className={`p-2 rounded-xl
                ${
                  darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-100"
                }`}
              >
                <X size={22} />
              </button>
            </div>

            {/* COLLAPSE DESKTOP */}

            <div className="hidden md:flex justify-end mb-4">
              <button
                onClick={() =>
                  setCollapsed(!collapsed)
                }
                className={`p-2 rounded-xl transition
                ${
                  darkMode
                    ? "hover:bg-gray-800"
                    : "hover:bg-gray-100"
                }`}
              >
                {collapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </button>
            </div>

            {/* LOGO */}

            <div
              className={`
                rounded-2xl py-4 px-3 text-center transition-all
                ${
                  darkMode
                    ? "bg-gray-800 text-gray-100"
                    : "bg-blue-50 text-blue-600"
                }
              `}
            >
              <h1 className="font-bold text-lg tracking-wide">
                {collapsed ? "N" : "Néré Admin"}
              </h1>
            </div>
          </div>

          {/* ================= MENU ================= */}

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;

                const active =
                  location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3
                      px-3 py-3 rounded-2xl
                      text-sm font-medium
                      transition-all duration-200

                      ${
                        active
                          ? "bg-blue-600 text-white shadow-lg"
                          : darkMode
                          ? "text-gray-300 hover:bg-gray-800"
                          : "text-gray-700 hover:bg-gray-100"
                      }

                      ${
                        collapsed
                          ? "md:justify-center"
                          : ""
                      }
                    `}
                  >
                    <Icon
                      size={20}
                      className="flex-shrink-0"
                    />

                    {!collapsed && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}