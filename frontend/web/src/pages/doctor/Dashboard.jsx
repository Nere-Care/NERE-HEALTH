import { useState, useEffect, useCallback } from "react";
import StatsSection from "../../components/doctors/dashboard/StatsSection";
import RevenueChart from "../../components/doctors/dashboard/RevenueChart";
import ConsultationChart from "../../components/doctors/dashboard/ConsultationChart";
import TodayAppointments from "../../components/doctors/dashboard/TodayAppoitment";
import RecentPatients from "../../components/doctors/dashboard/RecentPatient";
import NewsPanel from "../../components/doctors/dashboard/NewsPanel";
import AccountStatusBanner from "../../components/ui/AccountStatusBanner";
import NotificationBanner from "../../components/ui/NotificationBanner";
import ProfileCompletionBanner from "../../components/ui/ProfileCompletionBanner";
import { get } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { getProfileCompletion } from "../../utils/profileCompletion";
import { formatCurrency } from "../../utils/currency";

export default function Dashboard({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const currentUser = getStoredUser();
  const isSuspended = currentUser?.statut === "suspendu";
  const isBanned = currentUser?.statut === "banni";
  const [notifVisible, setNotifVisible] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      get("/api/medecins/dashboard"),
      get(`/api/medecins/${currentUser?.id}`).catch(() => null),
    ])
      .then(([dashboardData, profile]) => {
        setData(dashboardData);
        setDoctorProfile(profile);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

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

      <AccountStatusBanner 
        statut={currentUser?.statut} 
        suspendMessage="Votre compte est suspendu. La création de consultations et de rendez-vous est désactivée." 
      />

      {doctorProfile && <ProfileCompletionBanner percent={getProfileCompletion(currentUser, doctorProfile).percent} />}

      <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Vue d'ensemble des activités médicales, consultations et performances
      </p>

      <NotificationBanner 
        notifCount={data?.notifications?.length || 0} 
        notifVisible={notifVisible} 
        onClose={() => setNotifVisible(false)} 
        onClick={() => {}} 
        darkMode={darkMode} 
      />

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