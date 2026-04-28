import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Bell, FolderOpen, Video, Settings, HelpCircle, Sparkles, Menu, X
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
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      {/* Bouton hamburger - visible quand sidebar fermée */}
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-xl lg:hidden
            ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700 shadow"}`}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay sombre quand sidebar ouverte */}
      {ouvert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen w-56 flex flex-col justify-between py-6 px-4 z-50 shadow-lg transition-transform duration-300
        ${darkMode ? "bg-gray-800" : "bg-white"}
        ${ouvert ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}>

        {/* Bouton fermer - visible seulement quand ouverte sur petit écran */}
        <div className="flex flex-col gap-1">

          {/* Bouton X pour fermer */}
          <button
            onClick={() => setOuvert(false)}
            className={`lg:hidden self-end p-1 rounded-lg mb-2
              ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>

          {/* Logo */}
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
                  onClick={() => {
                    navigate(item.path);
                    setOuvert(false);
                  }}
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
    </>
  );
}