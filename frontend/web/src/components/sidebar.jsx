import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { get } from "../services/apiClient";
import {
  LayoutDashboard, Users, Building2, MessageSquare, Bell,
  FolderOpen, Video, Settings, HelpCircle, Sparkles, Menu, X,
  CreditCard, ChevronLeft, ChevronRight, Calendar, FileText, Receipt,
  Stethoscope, LogOut, User as UserIcon,
} from "lucide-react";
import logo from "../assets/logo.png";

const menuByRole = {
  patient: [
    { icon: LayoutDashboard, label: "Tableau de Bord", path: "/Patient-dashboard" },
    { icon: Users, label: "Annuaire Médecins", path: "/annuaire" },
    { icon: Building2, label: "Structures de Santé", path: "/structures" },
    { icon: FolderOpen, label: "Ma Santé", path: "/dossiers" },
    { icon: Calendar, label: "Rendez-vous", path: "/rendez-vous" },
    { icon: FileText, label: "Prescriptions", path: "/prescriptions" },
    { icon: Receipt, label: "Factures", path: "/factures" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
  ],
  doctor: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard" },
    { icon: Users, label: "Avis", path: "/doctors" },
    { icon: Building2, label: "Structures de Santé", path: "/structures" },
    { icon: Calendar, label: "Rendez-vous", path: "/appointments" },
    { icon: MessageSquare, label: "Messages", path: "/doctor-messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
  ],
  nurse: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard" },
    { icon: Users, label: "Avis", path: "/doctors" },
    { icon: Calendar, label: "Rendez-vous", path: "/appointments" },
    { icon: MessageSquare, label: "Messages", path: "/doctor-messages" },
    { icon: Video, label: "Teleconsultation", path: "/teleconsultation" },
    { icon: FolderOpen, label: "Dossiers médicaux", path: "/patients" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
  ],
  structure: [
    { icon: LayoutDashboard, label: "Structure", path: "/structure-dashboard" },
    { icon: Users, label: "Personnel", path: "/structure/personnel" },
    { icon: FolderOpen, label: "Dossiers", path: "/structure/demandes" },
    { icon: MessageSquare, label: "Messages", path: "/messages" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Calendar, label: "Rendez-vous", path: "/structure/rendezvous" },
    { icon: Settings, label: "Paramètres", path: "/structure/parametres" },
    { icon: HelpCircle, label: "Aide", path: "/structure/aide" },
  ],
  observer: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/observer-dashboard" },
    { icon: Users, label: "Patient", path: "/observer/patient" },
    { icon: Users, label: "Professionnel", path: "/observer/doctor" },
    { icon: Building2, label: "Structures de Santé", path: "/observer/structure" },
  ],
  admin: [
    { icon: LayoutDashboard, label: "Dashboard", path: "/doctor-dashboard" },
    { icon: Users, label: "Patients", path: "/patients" },
    { icon: Stethoscope, label: "Médecins", path: "/doctors" },
    { icon: Calendar, label: "Rendez-vous", path: "/appointments" },
    { icon: CreditCard, label: "Paiements", path: "/payments" },
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
  const [specialiteLabel, setSpecialiteLabel] = useState('');

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u?.role === 'doctor' && u?.id) {
        Promise.all([
          get(`/api/medecin_specialites?medecin_id=${u.id}`),
          get('/api/specialites'),
        ]).then(([ms, allSpecs]) => {
          const specIds = (ms || []).map(m => m.specialite_id);
          const matched = (allSpecs || []).filter(s => specIds.includes(s.id));
          if (matched.length > 0) setSpecialiteLabel(matched.map(s => s.libelle_fr).join(', '));
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Lecture du rôle directement depuis localStorage (pas de useEffect)
  const role = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?.role || null;
    } catch {
      return null;
    }
  })();

  const navigate = useNavigate();
  const location = useLocation();

  const items = menuByRole[role] || [];

  const handleNavigate = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* TOP BAR MOBILE */}
      <div className={`md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 shadow
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
        <img src={logo} alt="Néré Health" className="h-8 object-contain" />
        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* OVERLAY MOBILE */}
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
      )}

      {/* SIDEBAR */}
      <div className={`
        fixed top-0 left-0 h-screen flex flex-col justify-between py-6 px-4 z-50 shadow-lg
        transform transition-all duration-300
        ${collapsed ? "w-20" : "w-56"}
        ${darkMode ? "bg-gray-800" : "bg-white"}
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}>

        <div className="flex flex-col gap-1">

          {/* CLOSE BUTTON MOBILE */}
          <div className="md:hidden flex justify-between items-center mb-3">
            <span className="font-semibold">Menu</span>
            <button onClick={() => setOpen(false)}><X /></button>
          </div>

          {/* LOGO DESKTOP */}
          <div className="hidden md:flex items-center justify-between mb-4">
            {/* {!collapsed && (
              <img src={logo} alt="Néré Health" className="h-8 object-contain" />
            )} */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-2 rounded-lg transition
                ${darkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-700"}`}
            >
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
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                    ${isActive
                      ? "bg-blue-600 text-white font-semibold"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-500 hover:bg-gray-100"}
                    ${collapsed ? "justify-center" : ""}`}
                >
                  <div className="relative">
                    <Icon size={18} />
                    {item.path === "/notifications" && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                        3
                      </span>
                    )}
                  </div>
                  {!collapsed && item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* UTILISATEUR */}
        <div className={`border-t pt-3 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-xs font-bold ${darkMode ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}>
              {(() => {
                try {
                  const u = JSON.parse(localStorage.getItem("user"));
                  if (u?.photo_url) {
                    return <img src={u.photo_url} alt="" className="w-full h-full object-cover" />;
                  }
                  return u?.prenom?.[0]?.toUpperCase() || u?.nom?.[0]?.toUpperCase() || 'U';
                } catch { return 'U'; }
              })()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem("user"));
                      return [u?.prenom, u?.nom].filter(Boolean).join(' ');
                    } catch { return 'Utilisateur'; }
                  })()}
                </p>
                <p className={`text-[10px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {(() => {
                    try {
                      const u = JSON.parse(localStorage.getItem("user"));
                      if (u?.role === 'doctor' && specialiteLabel) return specialiteLabel;
                      return u?.role || '';
                    } catch { return ''; }
                  })()}
                </p>
              </div>
            )}
          </div>
          <button onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href = '/'; }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl mt-1 transition-all
              ${darkMode ? "text-red-400 hover:bg-gray-700" : "text-red-500 hover:bg-red-50"}
              ${collapsed ? "justify-center" : ""}`}>
            <LogOut size={18} />
            {!collapsed && "Déconnexion"}
          </button>
        </div>
      </div>
    </>
  );
}