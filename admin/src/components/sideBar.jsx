import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  FileText,
  Settings,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: Stethoscope, label: "Doctors", path: "/doctors" },
  { icon: Building2, label: "Structures", path: "/structures" },
  { icon: FileText, label: "Reports", path: "/reports" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help", path: "/help" },
];

export default function Sidebar({ darkMode, collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE TOPBAR */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
      >
        <h1 className="font-bold text-blue-600">Néré Admin</h1>

        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-50
          flex flex-col justify-between
          py-6 px-4 shadow-lg
          transition-all duration-300

          ${collapsed ? "w-20" : "w-64"}
          ${darkMode ? "bg-gray-800" : "bg-white"}

          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col gap-2">

          {/* MOBILE CLOSE */}
          <div className="md:hidden flex justify-between items-center mb-3">
            <span>Menu</span>
            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          {/* COLLAPSE */}
          <div className="hidden md:flex justify-end mb-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-lg
                ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-700"}
              `}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* LOGO */}
          <div
            className={`
              rounded-2xl p-3 text-center mb-6
              ${darkMode ? "bg-gray-700 text-gray-200" : "bg-blue-50 text-blue-600"}
            `}
          >
            <h1 className="font-bold text-lg">
              {collapsed ? "N" : "Néré Admin"}
            </h1>
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all
                    ${active
                      ? "bg-blue-600 text-white"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"}
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <Icon size={18} />
                  {!collapsed && item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI */}
        <button
          className={`
            flex items-center gap-3 px-3 py-3 rounded-xl text-sm
            ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-blue-50"}
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <Sparkles size={18} />
          {!collapsed && "Néré AI"}
        </button>
      </div>
    </>
  );
}