import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Bell, FolderOpen, Video, Settings, HelpCircle, Sparkles
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/" },
  { icon: Users, label: "Annuaire Medecins", path: "/annuaire" },
  { icon: Building2, label: "Structures de Sante", path: "/structures" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: FolderOpen, label: "Dossiers patient", path: "/dossiers" },
  { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
  { icon: Settings, label: "Parametres", path: "/parametres" },
  { icon: HelpCircle, label: "Aide", path: "/aide" },
];

export default function Sidebar({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`fixed top-0 left-0 h-screen w-56 flex flex-col justify-between py-6 px-4 z-50 shadow-lg
      ${darkMode ? "bg-gray-800" : "bg-white"}`}>
      
      {/* Logo */}
      <div className="flex flex-col gap-1">
        <div className={`rounded-xl p-3 text-center text-sm font-semibold mb-4
          ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
          LOGO
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${isActive
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

      {/* Nere IA */}
      <button className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl
        ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-500 hover:bg-blue-50"}`}>
        <Sparkles size={18} />
        Nere IA
      </button>

    </div>
  );
}