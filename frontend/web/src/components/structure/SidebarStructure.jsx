import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar,
  Settings, HelpCircle, Sparkles, Menu, X,
  Inbox, Building2
} from "lucide-react";

export default function SidebarStructure({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ouvert, setOuvert] = useState(false);

  // Fusion de tous les items pour éviter la séparation en bas
  const allItems = [
    { icon: LayoutDashboard, label: "Tableau de Bord", path: "/structure" },
    { icon: Building2, label: "Profil", path: "/structure/profil" }, // Icône changée pour correspondre au diagramme
    { icon: Calendar, label: "Rendez-vous", path: "/structure/rendezvous" },
    { icon: Inbox, label: "Demandes", path: "/structure/demandes" },
    { icon: Users, label: "Personnel", path: "/structure/personnel" },
    { icon: Settings, label: "Paramètres", path: "/structure/parametres" },
    { icon: HelpCircle, label: "Aide", path: "/structure/aide" },
  ];

  return (
    <>
      {/* Bouton mobile */}
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-xl lg:hidden
            ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700 shadow"}`}
        >
          <Menu size={20} />
        </button>
      )}

      {/* Overlay mobile */}
      {ouvert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      {/* Sidebar principale */}
      <div className={`fixed top-0 left-0 h-screen w-56 flex flex-col justify-between py-6 px-4 z-50 shadow-lg transition-transform duration-300
        ${darkMode ? "bg-gray-800" : "bg-white"}
        ${ouvert ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}>

        <div className="flex flex-col gap-1">
          {/* Fermer mobile */}
          <button
            onClick={() => setOuvert(false)}
            className={`lg:hidden self-end p-1 rounded-lg mb-2
              ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>

          {/* LOGO (Style harmonisé avec la sidebar patient) */}
          <div className="flex items-center justify-center mb-6">
            <img
              src="/logo.png"
              alt="logo"
              className="h-12 object-contain"
            />
          </div>

          {/* NAVIGATION UNIQUE */}
          <nav className="flex flex-col gap-1">
            {allItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setOuvert(false);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${isActive
                      ? "bg-blue-600 text-white font-semibold shadow-md"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Nere IA toujours en bas pour l'appel à l'action */}
        <button className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl font-medium
          ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-600 hover:bg-blue-50"}`}>
          <Sparkles size={18} />
          Nere IA
        </button>
      </div>
    </>
  );
}