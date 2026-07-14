import { useState, useEffect, useCallback } from "react";
import { AlertCircle, Settings } from "lucide-react";
import StatsSection from "../../components/doctors/dashboard/StatsSection";
import RevenueChart from "../../components/doctors/dashboard/RevenueChart";
import ConsultationChart from "../../components/doctors/dashboard/ConsultationChart";
import TodayAppointments from "../../components/doctors/dashboard/TodayAppoitment";
import RecentPatients from "../../components/doctors/dashboard/RecentPatient";
import NotificationsPanel from "../../components/doctors/dashboard/NotificationsPanel";
import NewsPanel from "../../components/doctors/dashboard/NewsPanel";
import ProfilMedecinModal from "../../components/doctors/profil/ProfilMedecinModal";
import { fetchMedecinDashboard } from "../../services/dashboardService";

export default function Dashboard({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [showProfil, setShowProfil] = useState(false);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const result = await fetchMedecinDashboard();
      setData(result);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>

      {/* Header avec bouton profil */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-500">
            Bonjour, Dr. {user.prenom || ""} {user.nom || ""}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vue d'ensemble de vos activites medicales
          </p>
        </div>

        {/* BOUTON MON PROFIL */}
        <button
          onClick={() => setShowProfil(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex-shrink-0
            ${darkMode
              ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
            }`}
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Mon profil</span>
        </button>
      </div>

      {erreur && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm
          ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
          <AlertCircle size={16} /> {erreur}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <StatsSection darkMode={darkMode} stats={data?.stats ?? []} />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <NewsPanel darkMode={darkMode} />
            <TodayAppointments darkMode={darkMode} appointments={data?.rdv_du_jour ?? []} />
            <RecentPatients darkMode={darkMode} patients={data?.patients_recents ?? []} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <RevenueChart darkMode={darkMode} data={data?.revenus_hebdo ?? []} />
            <ConsultationChart darkMode={darkMode} data={data?.consultations_mensuelles ?? []} />
          </div>

          <NotificationsPanel darkMode={darkMode} notifications={data?.notifications ?? []} />
        </>
      )}

      {/* Modal profil */}
      <ProfilMedecinModal
        open={showProfil}
        onClose={() => setShowProfil(false)}
        darkMode={darkMode}
      />
    </div>
  );
}