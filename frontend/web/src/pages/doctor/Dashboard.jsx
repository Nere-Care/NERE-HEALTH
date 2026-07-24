import { useState, useEffect } from "react";
import StatsSection from "../../components/doctors/dashboard/StatsSection";
import RevenueChart from "../../components/doctors/dashboard/RevenueChart";
import ConsultationChart from "../../components/doctors/dashboard/ConsultationChart";
import TodayAppointments from "../../components/doctors/dashboard/TodayAppoitment";
import RecentPatients from "../../components/doctors/dashboard/RecentPatient";
import NotificationsPanel from "../../components/doctors/dashboard/NotificationsPanel";
import NewsPanel from "../../components/doctors/dashboard/NewsPanel";
import { get } from "../../services/apiClient";

export default function Dashboard({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get("/api/medecins/dashboard")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}
    `}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
        Doctor Dashboard
      </h1>

      <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Vue d’ensemble des activités médicales, consultations et performances
      </p>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : data ? (
        <>
          <StatsSection stats={data.stats} darkMode={darkMode} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <NewsPanel darkMode={darkMode} />
            <TodayAppointments appointments={data.rendez_vous_aujourdhui} darkMode={darkMode} />
            <RecentPatients patients={data.patients_recents} darkMode={darkMode} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <RevenueChart revenueData={data.revenue_hebdomadaire} darkMode={darkMode} />
            <ConsultationChart consultationsData={data.consultations_mensuelles} darkMode={darkMode} />
          </div>

          <NotificationsPanel notifications={data.notifications} darkMode={darkMode} />
        </>
      ) : (
        <p className="text-gray-400">Erreur de chargement des données</p>
      )}
    </div>
  );
}