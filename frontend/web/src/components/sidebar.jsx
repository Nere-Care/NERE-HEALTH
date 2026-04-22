import { useState } from "react";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Bell, FolderOpen, Video, Settings, HelpCircle, Sparkles
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de Bord" },
  { icon: Users, label: "Annuaire Medecins" },
  { icon: Building2, label: "Structures de Sante" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Bell, label: "Notifications" },
  { icon: FolderOpen, label: "Dossiers patient" },
  { icon: Video, label: "Teleconsultation" },
  { icon: Settings, label: "Parametres" },
  { icon: HelpCircle, label: "Aide" },
];

export default function Sidebar() {
  const [active, setActive] = useState("Tableau de Bord");

  return (
    <div className="fixed top-0 left-0 h-screen w-56 bg-white shadow-lg flex flex-col justify-between py-6 px-4 z-50">
      
      {/* Logo */}
      <div className="flex flex-col gap-1">
        <div className="rounded-xl bg-gray-100 p-3 text-center text-sm font-semibold text-gray-500 mb-6">
          LOGO
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActive(item.label)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                  ${isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
      <button className="flex items-center gap-2 px-3 py-2.5 text-sm text-blue-500 hover:bg-blue-50 rounded-xl">
        <Sparkles size={18} />
        Nere IA
      </button>

    </div>
  );
}