import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ShieldAlert, ChevronRight, Megaphone } from "lucide-react";
import StatsSection from "../../components/doctors/dashboard/StatsSection";
import RevenueChart from "../../components/doctors/dashboard/RevenueChart";
import ConsultationChart from "../../components/doctors/dashboard/ConsultationChart";
import TodayAppointments from "../../components/doctors/dashboard/TodayAppoitment";
import RecentPatients from "../../components/doctors/dashboard/RecentPatient";
import NewsPanel from "../../components/doctors/dashboard/NewsPanel";
import { get } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { formatCurrency } from "../../utils/currency";

export default function Dashboard({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = getStoredUser();
  const isSuspended = currentUser?.statut === "suspendu";
  const isBanned = currentUser?.statut === "banni";
  const [notifVisible, setNotifVisible] = useState(true);

  const fetchData = useCallback(() => {
    get("/api/medecins/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(fetchData, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchData]);

  const devise = data?.devise || "XAF";

  const formattedStats = data?.stats?.map((s) => {
    if (s.title === "Revenu journalier") {
      return { ...s, value: formatCurrency(s.value, devise) };
    }
    return s;
  });

  return (
    <div className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}
    `}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
        Doctor Dashboard
      </h1>

      {(isSuspended || isBanned) && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          isBanned
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : "bg-orange-500/10 border-orange-500/30 text-orange-400"
        }`}>
          <AlertTriangle size={20} />
          <div>
            <p className="font-semibold">
              {isBanned ? "Compte banni" : "Compte suspendu"}
            </p>
            <p className="text-sm opacity-80">
              {isBanned
                ? "Votre compte a été banni. Veuillez contacter l'administration."
                : "Votre compte est suspendu. La création de consultations et de rendez-vous est désactivée."}
            </p>
          </div>
        </div>
      )}

      <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Vue d'ensemble des activités médicales, consultations et performances
      </p>

      {notifVisible && data?.notifications?.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border-l-4 border-orange-500 shadow-sm flex items-center justify-between cursor-pointer hover:opacity-90 transition-all"
          style={darkMode ? { backgroundColor: "#1e293b" } : { backgroundColor: "#fff7ed" }}>
          <div className="flex items-center gap-3 flex-1" onClick={() => {}}>
            <ShieldAlert className="text-orange-500 flex-shrink-0" size={20} />
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Notifications importantes</p>
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{data.notifications.length}</span>
              </div>
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Vous avez {data.notifications.length} notification{data.notifications.length > 1 ? 's' : ''} non lue{data.notifications.length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ChevronRight size={16} className="text-orange-500" />
            <button onClick={(e) => { e.stopPropagation(); setNotifVisible(false); }}
              className="text-orange-500 hover:text-red-500 text-lg font-bold px-2">✕</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : data ? (
        <>
          <StatsSection stats={formattedStats} darkMode={darkMode} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <NewsPanel darkMode={darkMode} />
            <TodayAppointments appointments={data.rendez_vous_aujourdhui} darkMode={darkMode} />
            <RecentPatients patients={data.patients_recents} darkMode={darkMode} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <RevenueChart revenueData={data.revenue_hebdomadaire} devise={devise} darkMode={darkMode} />
            <ConsultationChart consultationsData={data.consultations_mensuelles} darkMode={darkMode} />
          </div>
        </>
      ) : (
        <p className="text-gray-400">Erreur de chargement des données</p>
      )}
    </div>
  );
}