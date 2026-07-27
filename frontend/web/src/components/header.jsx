import { Bell, Sun, Moon, Settings, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { fetchNotifications } from "../services/notificationService";
import { onWebSocketMessage } from "../services/websocketService";


export default function Header({ titre, darkMode, setDarkMode, collapsed }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [nonLues, setNonLues] = useState(0);



// Dans Header(), ajoute a cote du polling existant :
useEffect(() => {
  const unsubscribe = onWebSocketMessage((data) => {
    if (data.event === "nouvelle_notification" || data.event === "nouveau_message") {
      setNonLues((prev) => prev + 1);
    }
  });
  return unsubscribe;
}, []);



  // Récupération user depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
  }, []);

  // Charger le nombre de notifications non lues
  const chargerNonLues = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      const count = (data ?? []).filter(n => n.statut !== "lu").length;
      setNonLues(count);
    } catch {
      // Silencieux — pas d'affichage d'erreur sur le header
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    chargerNonLues();
  }, [chargerNonLues]);

  // Polling toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(chargerNonLues, 30000);
    return () => clearInterval(interval);
  }, [chargerNonLues]);

  // Rafraîchir quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const handleFocus = () => chargerNonLues();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [chargerNonLues]);

  const initial = user?.prenom?.trim()?.[0]?.toUpperCase() || "?";
  const fullName = user
    ? `${user.prenom?.trim() || ""} ${user.nom?.trim() || ""}`.trim()
    : "Invité";

  const handleNotifClick = () => {
    navigate("/notifications");
    // Rafraîchir le compteur après navigation (les notifs seront marquées lues)
    setTimeout(chargerNonLues, 1000);
  };

  return (
    <div className={`
      sticky sm:fixed top-14 md:top-0 left-0 right-0 z-40
      flex items-center justify-between
      px-3 sm:px-4 md:px-6 py-3 md:py-4
      shadow-sm transition-colors
      ${collapsed ? "md:left-20" : "md:left-56"}
      ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}
    `}>

      {/* LOGO */}
      <div className={`rounded-xl p-3 text-center text-sm font-semibold mb-4
        ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
        {collapsed ? "LOGO" : "LOGO"}
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* DARK MODE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full relative transition-all duration-300
            ${darkMode ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full absolute top-0.5
            flex items-center justify-center transition-all duration-300 bg-white
            ${darkMode ? "right-0.5" : "left-0.5"}`}>
            {darkMode
              ? <Moon size={11} className="text-blue-600" />
              : <Sun size={11} className="text-yellow-500" />}
          </div>
        </button>

        {/* NOTIFICATIONS */}
        <div onClick={handleNotifClick} className="relative cursor-pointer">
          <Bell size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
          {nonLues > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[14px] h-[14px] sm:min-w-[16px] sm:h-[16px] flex items-center justify-center px-0.5">
              {nonLues > 99 ? "99+" : nonLues}
            </span>
          )}
        </div>

        {/* SETTINGS */}
        <div onClick={() => navigate("/parametres")} className="cursor-pointer">
          <Settings size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </div>

        {/* HELP */}
        <div onClick={() => navigate("/aide")} className="cursor-pointer">
          <HelpCircle size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </div>

        {/* PROFILE */}
        <div onClick={() => navigate("/profile")} className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-600 text-xs sm:text-sm font-bold">{initial}</span>
          </div>
          <span className={`hidden sm:block text-xs sm:text-sm font-medium
            ${darkMode ? "text-white" : "text-gray-700"}`}>
            {fullName}
          </span>
        </div>

      </div>
    </div>
  );
}