import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { useLanguage } from "../LanguageContext";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Bell, FolderOpen, Settings, HelpCircle, Sparkles,
  Menu, X, Calendar, FileText, ClipboardList, CreditCard,
} from "lucide-react";

// Labels fixes en français — plus besoin de t[labelKey]
const menuPatient = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/dashboard" },
  { icon: Users, label: "Annuaire Médecins", path: "/annuaire" },
  { icon: Building2, label: "Structures de Santé", path: "/structures" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: FolderOpen, label: "Ma Santé", path: "/dossiers" },
  { icon: ClipboardList, label: "Prescriptions", path: "/prescriptions" },
  { icon: CreditCard, label: "Factures", path: "/factures" },
  { icon: Settings, label: "Paramètres", path: "/parametres" },
  { icon: HelpCircle, label: "Aide", path: "/aide" },
];

const menuStructure = [
  { icon: LayoutDashboard, label: "Tableau de Bord", path: "/structure" },
  { icon: Users, label: "Profil", path: "/structure/profil" },
  { icon: Calendar, label: "Rendez-vous", path: "/structure/rendezvous" },
  { icon: FileText, label: "Demandes", path: "/structure/demandes" },
  { icon: MessageSquare, label: "Personnel", path: "/structure/personnel" },
  { icon: Settings, label: "Paramètres", path: "/structure/parametres" },
  { icon: HelpCircle, label: "Aide", path: "/structure/aide" },
];

export default function Sidebar({ darkMode, role, nomStructure, typeStructure }) {
  // const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [ouvert, setOuvert] = useState(false);

  const menuItems = role === "structure" ? menuStructure : menuPatient;

  const typeCouleurs = {
    Hôpital: "bg-blue-600",
    Clinique: "bg-green-600",
    Pharmacie: "bg-purple-600",
    Laboratoire: "bg-orange-600",
  };

  const handleNavigate = (path) => {
    navigate(path);
    setOuvert(false);
  };

  return (
    <>
      {/* BOUTON HAMBURGER — mobile uniquement */}
      <button
        onClick={() => setOuvert(true)}
        aria-label="Ouvrir le menu"
        className={`
          fixed top-4 left-4 z-[200]
          p-2 rounded-xl lg:hidden
          ${darkMode
            ? "bg-gray-800 text-white hover:bg-gray-700"
            : "bg-white text-gray-800 shadow-lg hover:bg-gray-100"
          }
        `}
      >
        <Menu size={22} />
      </button>

      {/* OVERLAY mobile */}
      {ouvert && (
        <div
          className="fixed inset-0 bg-black/50 z-[150] lg:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{ top: "70px", width: "256px", height: "calc(100vh - 70px)" }}
        className={`
          fixed left-0
          flex flex-col
          px-3 py-3
          shadow-2xl
          overflow-y-auto
          transition-transform duration-300 ease-in-out
          z-[160]

          ${darkMode
            ? "bg-gray-800 text-white border-r border-gray-700"
            : "bg-white text-gray-800 border-r border-gray-200"
          }

          ${ouvert ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* BOUTON FERMER mobile */}
        <div className="flex justify-end lg:hidden mb-2">
          <button
            onClick={() => setOuvert(false)}
            className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* INFOS STRUCTURE */}
        {role === "structure" && (
          <div className={`rounded-2xl p-4 mb-4 text-center text-white ${typeCouleurs[typeStructure] || "bg-blue-600"}`}>
            <h2 className="font-bold text-lg">{nomStructure}</h2>
            <p className="text-sm opacity-90">{typeStructure}</p>
          </div>
        )}

        {/* MENU */}
        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`
                  flex items-center gap-3
                  px-4 py-2.5 rounded-xl
                  text-sm transition-all duration-200 text-left w-full

                  ${isActive
                    ? "bg-blue-600 text-white font-semibold shadow-md"
                    : darkMode
                    ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* BOUTON IA */}
        <button
          className={`
            flex items-center gap-3 px-4 py-2.5 rounded-xl
            text-sm transition-all mt-2 shrink-0
            ${darkMode
              ? "text-blue-400 hover:bg-gray-700 hover:text-white"
              : "text-blue-600 hover:bg-blue-50"
            }
          `}
        >
          <Sparkles size={18} className="shrink-0" />
          {/* {t.nereIA} */}
          <span>Néré IA</span>
        </button>
      </aside>
    </>
  );
}