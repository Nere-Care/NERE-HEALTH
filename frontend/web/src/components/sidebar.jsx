import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from '../LanguageContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  Bell,
  FolderOpen,
  Video,
  Settings,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";



const menuByRole = {
  patient: [
    { icon: LayoutDashboard, label: "Tableau de Bord", path: "/patient-dashboard" },
    { icon: Users, label: "Annuaire Medecins", path: "/annuaire" },
    { icon: Building2, label: "Structures de Sante", path: "/structures" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: FolderOpen, label: "Dossiers patient", path: "/dossiers" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
  ],

  doctor: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard" },
    { icon: Users, label: "avis", path: "/doctors" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
  ],

  nurse: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard" },
    { icon: Users, label: "avis", path: "/doctors" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
  ],

  structure: [
    { icon: Building2, label: "Structure", path: "/structure-dashboard" },
    { icon: Users, label: "Personnel", path: "/staff" },
    { icon: FolderOpen, label: "Dossiers", path: "/dossiers" },
  ],
  observer: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/observer-dashboard" },
  ]
};
  


export default function Sidebar({ darkMode }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(null);

  // NOUVEAU STATE
  const [collapsed, setCollapsed] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();


   /* ================= LOAD USER ROLE ================= */
  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  setRole(user?.role);
}, []);

  const items = menuByRole[role] || [];

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false); // ferme le menu mobile après navigation
  };



  return (
    <>
      {/* ================= TOP BAR MOBILE ================= */}
      <div
        className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}
      >
        <div className="font-semibold">LOGO</div>

        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* ================= OVERLAY MOBILE ================= */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <div
        className={`
          fixed top-0 left-0 h-screen flex flex-col justify-between py-6 px-4 z-50 shadow-lg
          transform transition-all duration-300

          ${collapsed ? "w-20" : "w-56"}

          ${darkMode ? "bg-gray-800" : "bg-white"}

          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* ================= HEADER ================= */}
        <div className="flex flex-col gap-1">

          {/* CLOSE BUTTON MOBILE */}
          <div className="md:hidden flex justify-between items-center mb-3">
            <span className="font-semibold">Menu</span>
            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          {/* BOUTON COLLAPSE DESKTOP */}
          <div className="hidden md:flex justify-end mb-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-lg transition
                ${
                  darkMode
                    ? "hover:bg-gray-700 text-white"
                    : "hover:bg-gray-100 text-gray-700"
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
            className={`rounded-xl p-3 text-center text-sm font-semibold mb-4
            ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}
          >
            {collapsed ? "N" : "LOGO"}
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-1">

            {items?.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }

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

        {/* Nere IA */}
        <button
          className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl
          ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-500 hover:bg-blue-50"}

          ${collapsed ? "justify-center" : ""}
          `}
        >
          <Sparkles size={18} />

          {!collapsed && "nereIA"}
        </button>
      </div>
    </>
  );
}