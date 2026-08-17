import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  CircleHelp,
  FileText,
  Receipt,
  Stethoscope,
} from "lucide-react";

const menuByRole = {
  patient: [
    { icon: LayoutDashboard, label: "Tableau de Bord", path: "/Patient-dashboard", tourId: "menu-tableau-de-bord" },
    { icon: Users, label: "Annuaire Médecins", path: "/annuaire", tourId: "menu-annuaire-medecins" },
    { icon: Building2, label: "Structures de Santé", path: "/structures", tourId: "menu-structures" },
    { icon: FolderOpen, label: "Dossiers Patient", path: "/dossiers", tourId: "menu-dossiers-patient" },
    { icon: Stethoscope, label: "Mes consultations", path: "/mes-consultations", tourId: "menu-mes-consultations" },
    { icon: FileText, label: "Prescriptions", path: "/prescriptions", tourId: "menu-prescriptions" },
    { icon: Receipt, label: "Factures", path: "/factures", tourId: "menu-factures" },
    { icon: MessageSquare, label: "Messages", path: "/messages", tourId: "menu-messages" },
    { icon: Sparkles, label: "Trouver rapidement un médecin", path: "#symptom-checker", isAi: true, tourId: "btn-symptom-checker" },
  ],

  medecin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard", tourId: "menu-dashboard" },
    { icon: Users, label: "Avis", path: "/doctors", tourId: "menu-avis" },
    { icon: Building2, label: "Structures de Santé", path: "/structures", tourId: "menu-structures" },
    { icon: Calendar, label: "Rendez-vous", path: "/appointments", tourId: "menu-rendez-vous" },
    { icon: MessageSquare, label: "Messages", path: "/messages", tourId: "menu-messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation", tourId: "menu-teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients", tourId: "menu-dossiers-médicaux" },
    { icon: CreditCard, label: "Paiements", path: "/payments", tourId: "menu-paiements" },
  ],

  nurse: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard", tourId: "menu-dashboard" },
    { icon: Users, label: "Avis", path: "/doctors", tourId: "menu-avis" },
    { icon: Calendar, label: "Rendez-vous", path: "/appointments", tourId: "menu-rendez-vous" },
    { icon: MessageSquare, label: "Messages", path: "/messages", tourId: "menu-messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation", tourId: "menu-teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients", tourId: "menu-dossiers-médicaux" },
    { icon: CreditCard, label: "Paiements", path: "/payments", tourId: "menu-paiements" },
  ],

  structure: [
    { icon: LayoutDashboard, label: "Structure", path: "/structure-dashboard", tourId: "menu-structure" },
    { icon: Users, label: "Personnel", path: "/structure/personnel", tourId: "menu-personnel" },
    { icon: FolderOpen, label: "Dossiers", path: "/structure/demandes", tourId: "menu-demandes" },
    { icon: MessageSquare, label: "Messages", path: "/messages", tourId: "menu-messages" },
    { icon: Bell, label: "Notifications", path: "/notifications", tourId: "menu-notifications" },
    { icon: Calendar, label: "Rendez-vous", path: "/structure/rendezvous", tourId: "menu-rendezvous" },
    { icon: Settings, label: "Paramètres", path: "/structure/parametres", tourId: "menu-parametres" },
    { icon: HelpCircle, label: "Aide", path: "/structure/aide", tourId: "menu-aide" },
  ],

  observer: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/observer-dashboard", tourId: "menu-dashboard" },
    { icon: Users, label: "Patient", path: "/observer/patient", tourId: "menu-patient" },
    { icon: Users, label: "Professional", path: "/observer/doctor", tourId: "menu-doctor" },
    { icon: Building2, label: "Structures de Santé", path: "/observer/structure", tourId: "menu-structure" },
  ],
};

const typeCouleurs = {
  Hôpital: "bg-blue-600",
  Clinique: "bg-green-600",
  Pharmacie: "bg-purple-600",
  Laboratoire: "bg-orange-600",
};

export default function Sidebar({ darkMode, collapsed, setCollapsed, nomStructure, typeStructure }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setRole(user?.role);
  }, []);

  const items = menuByRole[role] || [];

  const handleNavigate = (path, isAi = false) => {
    if (isAi || path === "#symptom-checker") {
      window.dispatchEvent(new CustomEvent("open-symptom-checker"));
      setOpen(false);
      return;
    }
    
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* TOP BAR MOBILE */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
        <button onClick={() => setOpen(true)}><Menu /></button>
      </div>

      {/* OVERLAY MOBILE */}
      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />}

      {/* SIDEBAR */}
      <div className={`fixed top-0 left-0 h-screen flex flex-col justify-between py-6 px-4 z-50 shadow-lg transform transition-all duration-300 ${collapsed ? "w-20" : "w-56"} ${darkMode ? "bg-gray-800" : "bg-white"} ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        
        <div className="flex flex-col gap-1">
          {/* CLOSE BUTTON MOBILE */}
          <div className="md:hidden flex justify-between items-center mb-3">
            <span className="font-semibold">Menu</span>
            <button onClick={() => setOpen(false)}><X /></button>
          </div>

          {/* BOUTON COLLAPSE DESKTOP */}
          <div className="hidden md:flex justify-end mb-3">
            <button onClick={() => setCollapsed(!collapsed)} className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-700"}`}>
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* INFOS STRUCTURE */}
          {role === "structure" && !collapsed && (
            <div className={`rounded-2xl p-4 mb-4 text-center text-white ${typeCouleurs[typeStructure] || "bg-blue-600"}`}>
              <h2 className="font-bold text-lg">{nomStructure}</h2>
              <p className="text-sm opacity-90">{typeStructure}</p>
            </div>
          )}

          {/* MENU */}
          <nav className="flex flex-col gap-1">
            {items?.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isAiButton = item.isAi || item.path === "#symptom-checker";

              return (
                <button
                  key={item.label}
                  data-tour={item.tourId} /* ← Attribut ciblé par react-joyride */
                  onClick={() => handleNavigate(item.path, isAiButton)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${isAiButton 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]" 
                      : isActive 
                        ? "bg-blue-600 text-white font-semibold" 
                        : darkMode 
                          ? "text-gray-300 hover:bg-gray-700" 
                          : "text-gray-500 hover:bg-gray-100"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                >
                  <div className="relative">
                    <Icon size={18} />
                    {item.path === "/notifications" && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">3</span>
                    )}
                  </div>
                  {!collapsed && item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Nere IA (Bas de sidebar) */}
        {role === "patient" && (
          <button
            data-tour="nere-ia-bottom" /* ← Attribut optionnel pour cibler le bouton du bas */
            onClick={() => window.dispatchEvent(new CustomEvent("open-symptom-checker"))}
            className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl transition-all hover:scale-[1.02]
              ${darkMode ? "text-blue-400 hover:bg-gray-700" : "text-blue-500 hover:bg-blue-50"}
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <Sparkles size={18} />
            {!collapsed && "NERE IA"}
          </button>
        )}
      </div>
    </>
  );
}