import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from '../LanguageContext';
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  Bell, FolderOpen, Video, Settings, HelpCircle, Sparkles,
  Menu, X, Calendar, FileText,ClipboardList,CreditCard,
} from "lucide-react";

const menuPatient = [
  { icon: LayoutDashboard, labelKey: "tableauDeBord", path: "/dashboard" },
  { icon: Users, labelKey: "annuaireMedecins", path: "/annuaire" },
  { icon: Building2, labelKey: "structuresSante", path: "/structures" },
  { icon: MessageSquare, labelKey: "messages", path: "/messages" },
  { icon: Bell, labelKey: "notifications", path: "/notifications" },
  { icon: FolderOpen, labelKey: "dossiersPatient", path: "/dossiers" },
  { icon: ClipboardList, label: "Prescriptions", path: "/prescriptions" },
  { icon: CreditCard, label: "Factures", path: "/factures" },
  { icon: Video, labelKey: "teleconsultation", path: "/teleconsultation" },
  { icon: Settings, labelKey: "parametres", path: "/parametres" },
  { icon: HelpCircle, labelKey: "aide", path: "/aide" },
];

const menuStructure = [
  { icon: LayoutDashboard, labelKey: "tableauDeBord", path: "/structure" },
  { icon: Users, label: "Profil", path: "/structure/profil" },
  { icon: Calendar, label: "Rendez-vous", path: "/structure/rendezvous" },
  { icon: FileText, label: "Demandes", path: "/structure/demandes" },
  { icon: MessageSquare, label: "Personnel", path: "/structure/personnel" },
  { icon: Settings, labelKey: "parametres", path: "/structure/parametres" },
  { icon: HelpCircle, labelKey: "aide", path: "/structure/aide" },
];

export default function Sidebar({ darkMode, role, nomStructure, typeStructure }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [ouvert, setOuvert] = useState(false);

  const menuItems = role === "structure" ? menuStructure : menuPatient;

  const typeCouleurs = {
    "Hôpital": "bg-blue-600",
    "Clinique": "bg-green-600",
    "Pharmacie": "bg-purple-600",
    "Laboratoire": "bg-orange-600",
  };

  return (
    <>
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-xl lg:hidden
            ${darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700 shadow"}`}
        >
          <Menu size={20} />
        </button>
      )}

      {ouvert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOuvert(false)}
        />
      )}

      <div className={`fixed top-0 left-0 h-screen w-60 flex flex-col justify-between py-6 px-4 z-50 shadow-lg transition-transform duration-300
        ${darkMode ? "bg-gray-800" : "bg-white"}
        ${ouvert ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}>

        <div className="flex flex-col gap-3">

          <button
            onClick={() => setOuvert(false)}
            className={`lg:hidden self-end p-1 rounded-lg mb-2
              ${darkMode ? "text-gray-300" : "text-gray-500"}`}
          >
            <X size={18} />
          </button>

          {/* Logo unique */}
        

          <div className={`rounded-xl p-3 text-center text-sm font-semibold mb-6
              ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
              LOGO
            </div>

          {/* Menu */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const label = item.labelKey ? t[item.labelKey] : item.label;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setOuvert(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all
                    ${isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-500 hover:bg-blue-100 hover:text-blue-700"
                    }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <button className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl
          ${darkMode ? "text-blue-400 hover:bg-gray-600 hover:text-white" : "text-blue-500 hover:bg-blue-50"}`}>
          <Sparkles size={18} />
          {t.nereIA}
        </button>

      </div>
    </>
  );
}