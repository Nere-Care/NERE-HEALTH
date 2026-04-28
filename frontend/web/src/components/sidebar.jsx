import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/" },
  { icon: Users, label: "Annuaire Medecins", path: "/annuaire" },
  { icon: Building2, label: "Structures de Sante", path: "/structures" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: FolderOpen, label: "Dossiers patient", path: "/dossiers" },
  { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
  { icon: CreditCard, label: "Paiements", path: "/payments" },
  { icon: Settings, label: "Parametres", path: "/parametres" },
  { icon: HelpCircle, label: "Aide", path: "/aide" },
];

export default function Sidebar({ darkMode }) {
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
          fixed top-0 left-0 h-screen w-56 flex flex-col justify-between py-6 px-4 z-50 shadow-lg
          transform transition-transform duration-300

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

          {/* LOGO */}
          <div
            className={`rounded-xl p-3 text-center text-sm font-semibold mb-4
            ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}
          >
            LOGO
          </div>

          {/* MENU */}
          <nav className="flex flex-col gap-1">

            {menuItems.map((item) => {
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
                    }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}

          </nav>
        </div>

        {/* ================= BOTTOM ================= */}
        <button
          className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl
          ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-500 hover:bg-blue-50"}`}
        >
          <Sparkles size={18} />
          Nere IA
        </button>
      </div>
    </>
  );
}