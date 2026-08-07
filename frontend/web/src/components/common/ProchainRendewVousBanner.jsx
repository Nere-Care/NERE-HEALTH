import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Video, MapPin, Clock } from "lucide-react";
import { fetchProchainRendezVous } from "../../services/dashboardService";

function formatCompteARebours(ms) {
  if (ms <= 0) return "C'est maintenant";
  const totalMinutes = Math.floor(ms / 60000);
  const jours = Math.floor(totalMinutes / 1440);
  const heures = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (jours > 0) return `Dans ${jours}j ${heures}h`;
  if (heures > 0) return `Dans ${heures}h ${minutes}min`;
  return `Dans ${minutes} min`;
}

export default function ProchainRendezVousBanner({ darkMode }) {
  const navigate = useNavigate();
  const [rdv, setRdv] = useState(null);
  const [compteARebours, setCompteARebours] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const data = await fetchProchainRendezVous();
        setRdv(data);
      } catch {
        setRdv(null);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  useEffect(() => {
    if (!rdv) return;
    const maj = () => {
      const diff = new Date(rdv.date_heure_debut).getTime() - Date.now();
      setCompteARebours(formatCompteARebours(diff));
    };
    maj();
    const interval = setInterval(maj, 30000);
    return () => clearInterval(interval);
  }, [rdv]);

  if (loading || !rdv) return null;

  const date = new Date(rdv.date_heure_debut);
  const estBientot = date.getTime() - Date.now() < 60 * 60 * 1000;

  return (
    <div
      onClick={() => navigate("/appointments")}
      className={`rounded-2xl p-4 sm:p-5 border cursor-pointer transition hover:shadow-md flex items-center gap-4
        ${estBientot
          ? darkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"
          : darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
        ${estBientot ? "bg-blue-500" : darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
        <Calendar size={22} className={estBientot ? "text-white" : darkMode ? "text-gray-300" : "text-gray-500"} />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Prochain rendez-vous
        </p>
        <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
          {rdv.interlocuteur}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
          <span className={`flex items-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            <Clock size={12} />
            {date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} a {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className={`flex items-center gap-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {rdv.type === "video" ? <Video size={12} /> : <MapPin size={12} />}
            {rdv.type === "video" ? "Teleconsultation" : "Presentiel"}
          </span>
        </div>
      </div>

      <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0
        ${estBientot ? "bg-blue-500 text-white animate-pulse" : darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
        {compteARebours}
      </div>
    </div>
  );
}