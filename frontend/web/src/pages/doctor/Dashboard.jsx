import StatsSection from "../../components/doctors/dashboard/StatsSection";
import RevenueChart from "../../components/doctors/dashboard/RevenueChart";
import ConsultationChart from "../../components/doctors/dashboard/ConsultationChart";
import SpecialtyPieChart from "../../components/doctors/dashboard/SpecialtyPieChart";
import TodayAppointments from "../../components/doctors/dashboard/TodayAppoitment";
import RecentPatients from "../../components/doctors/dashboard/RecentPatient";
import NotificationsPanel from "../../components/doctors/dashboard/NotificationsPanel";
import NewsPanel from "../../components/doctors/dashboard/NewsPanel";

export default function Dashboard({ darkMode, collapsed }) {
  return (
    <div className={`space-y-4 mt-6 sm:mt-4 sm:space-y-6 p-3 sm:p-5 lg:p-6 transition-colors
      ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}
    `}>

      <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6]">
        Doctor Dashboard
      </h1>

      {/* SOUS-TITRE */}
      <p
        className={`text-sm sm:text-base mt-1 ${
          darkMode ? "text-gray-400" : "text-gray-500"
        }`}
      >
        Vue d’ensemble des activités médicales, consultations et performances
      </p>

      <StatsSection darkMode={darkMode} />


       {/* Middle section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <NewsPanel darkMode={darkMode} />
        <TodayAppointments darkMode={darkMode} />
        <RecentPatients darkMode={darkMode} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RevenueChart darkMode={darkMode} />
        <ConsultationChart darkMode={darkMode} />
      </div>

     

      <NotificationsPanel darkMode={darkMode} />

    </div>
  );
}