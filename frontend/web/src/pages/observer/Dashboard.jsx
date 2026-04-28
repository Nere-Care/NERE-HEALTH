// ===============================
// FILE: ObserverDashboard.jsx
// ===============================
import GlobalStats from "../../components/observers/GlobalStats";
import EpidemicTrendChart from "../../components/observers/EpidemicTrendChart";
import RegionHeatmap from "../../components/observers/RegionHeatmap";
import DiseaseDistribution from "../../components/observers/DiseaseDistribution";
import DemographicsChart from "../../components/observers/DemographicsChart";
import SystemLoadAlerts from "../../components/observers/SystemLoadAlerts";
import ExportPanel from "../../components/observers/ExportPanel";

export default function ObserverDashboard({ darkMode }) {
  return (
    <div
      className={`min-h-screen p-3 sm:p-5 lg:p-6 space-y-6 transition
      ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-black"}`}
    >
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-500">
          Health Observatory Dashboard
        </h1>

        <p
          className={`text-sm mt-1 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          National, NGO and sponsor medical intelligence center
        </p>
      </div>

      {/* STATS */}
      <GlobalStats darkMode={darkMode} />

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EpidemicTrendChart darkMode={darkMode} />
        <RegionHeatmap darkMode={darkMode} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DiseaseDistribution darkMode={darkMode} />
        <DemographicsChart darkMode={darkMode} />
      </div>

      {/* ALERTS */}
      <SystemLoadAlerts darkMode={darkMode} />

      {/* EXPORT */}
      <ExportPanel darkMode={darkMode} />
    </div>
  );
}