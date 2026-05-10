import {
  Activity,
  BarChart3,
  Globe,
  AlertTriangle,
} from "lucide-react";

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
      className={`min-h-screen p-4 md:p-6 space-y-6 transition
      ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"}`}
    >
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl md:text-3xl font-bold">
            Health Observatory Dashboard
          </h1>
        </div>

        <p className="text-sm text-gray-500">
          National epidemiological intelligence and monitoring system
        </p>
      </div>

      {/* GLOBAL STATS */}
      <GlobalStats darkMode={darkMode} />

      {/* MAIN CHARTS */}
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