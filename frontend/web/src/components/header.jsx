import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Sun, Moon, Settings, HelpCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { get } from "../services/apiClient";
import { connectNotifStream, disconnectNotifStream, onNotification, notifyWindow } from "../services/notifStream";

export default function Header({ darkMode, setDarkMode, collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);
  const seenIds = useRef(new Set());

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); }
    catch { return null; }
  })();

  const showDeviceNotification = (n) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const url = n.type === "nouveau_message"
      ? (user?.role === "medecin" ? "/doctor-messages" : "/messages")
      : "/notifications";
    const notif = new Notification(`Néré Health · ${n.titre || "Notification"}`, {
      body: n.contenu || "",
      icon: logo,
      tag: n.id,
      requireInteraction: true,
    });
    notif.onclick = () => {
      window.focus();
      navigate(url);
      notif.close();
    };
  };

  const fetchNotifs = useCallback(() => {
    get('/api/notifications', { limit: 50 })
      .then(data => {
        const notifs = data || [];
        const unread = notifs.filter(n => n.statut !== 'lu');
        setNotifCount(unread.length);

        unread.forEach(n => {
          if (!seenIds.current.has(n.id)) {
            seenIds.current.add(n.id);
            showDeviceNotification(n);
          }
        });
      })
      .catch(() => {});
  }, [user?.role]);

  useEffect(() => {
    connectNotifStream();
    const unsubscribe = onNotification((event) => {
      if (event && event.statut !== 'lu') {
        if (!seenIds.current.has(event.id)) {
          seenIds.current.add(event.id);
          showDeviceNotification(event);
        }
        notifyWindow(event);
      }
      fetchNotifs();
    });
    return () => {
      unsubscribe();
      disconnectNotifStream();
    };
  }, [fetchNotifs]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    fetchNotifs();
  }, [location.pathname, fetchNotifs]);

  const nomComplet = [user?.prenom, user?.nom].filter(Boolean).join(' ') || 'Utilisateur';
  const initiale = user?.prenom?.[0]?.toUpperCase() || user?.nom?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`
      sticky sm:fixed top-14 md:top-0 left-0 right-0 z-40
      flex items-center justify-between
      px-3 sm:px-4 md:px-6 py-2
      shadow-sm transition-colors
      ${collapsed ? "md:left-20" : "md:left-56"}
      ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}
    `}>

      <img src={logo} alt="Néré Health"
        className={`object-contain transition-all duration-300 ${collapsed ? "w-32 h-10" : "w-62 h-20"}`} />

      <div className="flex items-center gap-3 sm:gap-4">

        <button onClick={() => setDarkMode(!darkMode)}
          className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full relative transition-all duration-300 ${darkMode ? "bg-blue-600" : "bg-gray-200"}`}>
          <div className={`w-5 sm:w-6 h-5 sm:h-6 rounded-full absolute top-0.5 flex items-center justify-center transition-all duration-300 bg-white ${darkMode ? "right-0.5" : "left-0.5"}`}>
            {darkMode ? <Moon size={11} className="text-blue-600" /> : <Sun size={11} className="text-yellow-500" />}
          </div>
        </button>

        <div onClick={() => {
          if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
          }
          navigate("/notifications");
        }} className="relative cursor-pointer">
          <Bell size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </div>

        <div onClick={() => navigate("/parametres")} className="cursor-pointer">
          <Settings size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </div>

        <div onClick={() => navigate("/aide")} className="cursor-pointer">
          <HelpCircle size={20} className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </div>

        <div onClick={() => navigate("/parametres")} className="flex items-center gap-2 cursor-pointer">
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center overflow-hidden ${darkMode ? "bg-blue-600" : "bg-blue-100"}`}>
            {user?.photo_url ? (
              <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={`text-xs sm:text-sm font-bold ${darkMode ? "text-white" : "text-blue-600"}`}>{initiale}</span>
            )}
          </div>
          <span className={`hidden sm:block text-xs sm:text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>
            {nomComplet}
          </span>
        </div>

      </div>
    </div>
  );
}
