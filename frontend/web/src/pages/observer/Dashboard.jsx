import { useMemo } from "react";
import { Users, Activity, AlertCircle, ShieldCheck, TrendingUp, MapPin } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";

import AnonStatCard from "../../components/observers/AnonAlertCard";
import AnonBarChart from "../../components/observers/AnonBarChart";
import AnonLineChart from "../../components/observers/AnonLineChart";
import AnonPieChart from "../../components/observers/AnonPieChart";
import ExportPanel from "../../components/observers/ExportCenter";
import FilterPanel from "../../components/observers/FilterPanel";

/* ================= ANONYMIZED MOCK DATA ================= */
const generateAnonStats = () => ({
  totalPatients: Math.floor(Math.random() * 500000) + 800000,
  activeProfessionals: Math.floor(Math.random() * 2000) + 3000,
  activeStructures: Math.floor(Math.random() * 100) + 150,
  criticalAlerts: Math.floor(Math.random() * 50) + 10,
  vaccinationRate: `${Math.floor(Math.random() * 20) + 70}%`,
  lastUpdate: new Date().toLocaleDateString("fr-FR"),
});

const regionData = [
  { region: "Littoral", cases: 12450, trend: "+12%" },
  { region: "Centre", cases: 9800, trend: "+5%" },
  { region: "Nord", cases: 6200, trend: "-3%" },
  { region: "Ouest", cases: 4100, trend: "+8%" },
  { region: "Sud", cases: 3500, trend: "+2%" },
].map(d => ({ ...d, region: `Région ${d.region.charAt(0)}***` })); // Anonymized

const trendData = Array.from({ length: 6 }, (_, i) => ({
  month: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"][i],
  cases: Math.floor(Math.random() * 5000) + 2000,
  anonymized: true,
}));

const diseaseData = [
  { name: "Pathologie A", value: 4200 },
  { name: "Pathologie B", value: 3100 },
  { name: "Pathologie C", value: 2400 },
  { name: "Autres", value: 1800 },
].map(d => ({ ...d, name: d.name.replace(/[A-Z]/g, "*") })); // Anonymized

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export default function ObserverGlobalDashboard({ darkMode }) {
  const stats = useMemo(() => generateAnonStats(), []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Vue Globale</h2>
          <p className="text-sm text-gray-400">Indicateurs épidémiologiques nationaux agrégés</p>
        </div>
        <FilterPanel darkMode={darkMode} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnonStatCard
          label="Patients suivis"
          value={stats.totalPatients.toLocaleString()}
          icon={Users}
          color="blue"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Professionnels actifs"
          value={stats.activeProfessionals.toLocaleString()}
          icon={Activity}
          color="green"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Alertes critiques"
          value={stats.criticalAlerts}
          icon={AlertCircle}
          color="red"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Couverture vaccinale"
          value={stats.vaccinationRate}
          icon={ShieldCheck}
          color="purple"
          anonymized
          darkMode={darkMode}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Epidemic Trend */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="font-semibold">Évolution épidémique</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? "#1e293b" : "#fff",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
                labelFormatter={(l) => `Période: ${l}`}
                formatter={(v) => [`${Number(v).toLocaleString()} cas`, "Estimation"]}
              />
              <Line type="monotone" dataKey="cases" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">🔒 Données agrégées et lissées</p>
        </div>

        {/* Regional Spread */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-green-500" size={20} />
            <h3 className="font-semibold">Répartition régionale</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionData}>
              <XAxis dataKey="region" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={11} interval={0} angle={-10} textAnchor="end" height={60} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? "#1e293b" : "#fff",
                  border: "none",
                  borderRadius: "12px",
                }}
                formatter={(v, n, p) => [`${Number(v).toLocaleString()} cas`, "Estimation"]}
              />
              <Bar dataKey="cases" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">🔒 Noms de régions partiellement anonymisés</p>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Disease Distribution */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-purple-500" size={20} />
            <h3 className="font-semibold">Répartition par pathologie</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie 
                data={diseaseData} 
                dataKey="value" 
                nameKey="name"
                cx="50%" 
                cy="50%" 
                outerRadius={70}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {diseaseData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? "#1e293b" : "#fff",
                  border: "none",
                  borderRadius: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">🔒 Noms de pathologies anonymisés</p>
        </div>

        {/* Demographics */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-indigo-500" size={20} />
            <h3 className="font-semibold">Distribution démographique</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { age: "0-17", count: 2800 },
              { age: "18-35", count: 5200 },
              { age: "36-59", count: 6100 },
              { age: "60+", count: 2400 },
            ]}>
              <XAxis dataKey="age" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">🔒 Tranches d'âge uniquement</p>
        </div>
      </div>

      {/* Export Panel */}
      <ExportPanel 
        darkMode={darkMode}
        dashboard="global"
        description="Export des indicateurs épidémiologiques agrégés"
      />
    </div>
  );
}