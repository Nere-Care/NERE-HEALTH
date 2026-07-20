import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Sun,
  Moon,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

// ✅ Import des fonctions d'authentification (ajuste le chemin si nécessaire)
import { getAdminUser, logoutAdmin } from "../services/AuthService";

export default function Header({
  titre = "Tableau de bord",
  darkMode,
  setDarkMode,
  collapsed,
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    // Récupérer les infos de l'admin depuis le localStorage (mis à jour lors du login)
    const currentUser = getAdminUser();
    setUser(currentUser);

    // Fermer le menu déroulant si on clique en dehors
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  // Générer les initiales (ex: "Jean Dupont" -> "JD")
  const initials = user
    ? `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`.toUpperCase()
    : "A";

  const displayName = user
    ? `${user.prenom} ${user.nom}`.trim()
    : "Administrateur";
    
  const displayRole = user?.role 
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1) 
    : "Admin";
    
  const displayEmail = user?.email || "admin@nere-health.cm";

  return (
    <header
      className={`
        fixed z-40 top-16 md:top-0 right-0 transition-all duration-300
        ${collapsed ? "md:left-20" : "md:left-64"} left-0
        ${darkMode ? "bg-gray-900 border-b border-gray-800" : "bg-white border-b border-gray-200"}
      `}
    >
      <div className="h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-4">
        
        {/* ================= LEFT ================= */}
        <div className="flex items-center min-w-0 flex-1">
          <div className="min-w-0">
            <h1 className={`text-sm sm:text-lg md:text-xl font-bold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
              {titre}
            </h1>
            <p className={`hidden sm:block text-xs mt-0.5 truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Néré Health Administration
            </p>
          </div>
        </div>

        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          
          {/* DARK MODE */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative w-12 h-6 rounded-full transition-all ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all duration-300 ${darkMode ? "right-0.5" : "left-0.5"}`}>
              {darkMode ? <Moon size={11} className="text-blue-600" /> : <Sun size={11} className="text-yellow-500" />}
            </div>
          </button>

          {/* NOTIFICATIONS */}
          <button
            onClick={() => navigate("/admin/notifications")}
            className={`relative p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Bell size={19} className={darkMode ? "text-gray-300" : "text-gray-600"} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
          </button>

          {/* SETTINGS */}
          <button
            onClick={() => navigate("/admin/settings")}
            className={`p-2 rounded-xl transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <Settings size={19} className={darkMode ? "text-gray-300" : "text-gray-600"} />
          </button>

          {/* ✅ PROFILE DROPDOWN CONNECTÉ */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 md:gap-3 cursor-pointer rounded-2xl px-2 py-1.5 transition ${
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
              } ${showProfileMenu ? (darkMode ? "bg-gray-800" : "bg-gray-100") : ""}`}
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-sm font-semibold">{initials}</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-sm font-medium leading-none ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {displayName}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {displayRole}
                </p>
              </div>
              <ChevronDown size={16} className={`hidden lg:block transition-transform duration-200 ${darkMode ? "text-gray-400" : "text-gray-500"} ${showProfileMenu ? "rotate-180" : ""}`} />
            </button>

            {/* Menu Déroulant */}
            {showProfileMenu && (
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl shadow-xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
                darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
              }`}>
                {/* Info utilisateur */}
                <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{displayName}</p>
                  <p className={`text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{displayEmail}</p>
                </div>
                
                {/* Liens */}
                <div className="py-1">
                  <button
                    onClick={() => { navigate("/admin/profile"); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                      darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <User size={16} />
                    Mon profil
                  </button>
                  
                  <button
                    onClick={() => { navigate("/admin/settings"); setShowProfileMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                      darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Settings size={16} />
                    Paramètres
                  </button>
                </div>

                {/* Déconnexion */}
                <div className={`border-t py-1 ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}