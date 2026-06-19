import { useMemo } from "react";
import { Users, Calendar, Activity, AlertCircle, TrendingUp, Shield } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts";

import AnonStatCard from "../../components/observers/AnonStatCard";
import AnonAlertCard from "../../components/observers/AnonAlertCard";
import ExportPanel from "../../components/observers/ExportPanel";
import FilterPanel from "../../components/observers/FilterPanel";

/* ================= ANONYMIZED PATIENT DATA ================= */
const generateAnonPatientStats = () => ({
  totalConsultations: Math.floor(Math.random() * 50000) + 100000,
  avgWaitTime: `${Math.floor(Math.random() * 20) + 10} min`,
  satisfactionRate: `${Math.floor(Math.random() * 15) + 80}%`,
  followUpRate: `${Math.floor(Math.random() * 20) + 70}%`,
});

const consultationTrend = Array.from({ length: 6 }, (_, i) => ({
  period: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"][i],
  consultations: Math.floor(Math.random() * 8000) + 5000,
  anonymized: true,
}));

const ageDistribution = [
  { range: "0-17", count: 18500 },
  { range: "18-35", count: 42000 },
  { range: "36-59", count: 38000 },
  { range: "60+", count: 15500 },
];

const alerts = [
  { id: 1, type: "Suivi manquant", count: 234, severity: "medium" },
  { id: 2, type: "Délai consultation", count: 156, severity: "low" },
  { id: 3, type: "Données incomplètes", count: 89, severity: "low" },
].map(a => ({ ...a, type: `Alerte ${String.fromCharCode(65 + a.id)}***` }));

export default function ObserverPatientsDashboard({ darkMode }) {
  const stats = useMemo(() => generateAnonPatientStats(), []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-purple-500" />
            Dashboard Patients
          </h2>
          <p className="text-sm text-gray-400">Données agrégées et anonymisées • Aucun identifiant personnel</p>
        </div>
        <FilterPanel darkMode={darkMode} />
      </div>

      {/* Privacy Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        darkMode ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200"
      }`}>
        <Shield className="text-purple-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-purple-500">🔒 Données 100% anonymisées</p>
          <p className="text-sm text-gray-400">
            Aucun nom, email, téléphone ou identifiant n'est visible. 
            Toutes les données sont agrégées par tranches démographiques.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnonStatCard
          label="Consultations"
          value={stats.totalConsultations.toLocaleString()}
          icon={Activity}
          color="purple"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Temps d'attente moyen"
          value={stats.avgWaitTime}
          icon={Calendar}
          color="blue"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Satisfaction"
          value={stats.satisfactionRate}
          icon={TrendingUp}
          color="green"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Suivi régulier"
          value={stats.followUpRate}
          icon={Shield}
          color="indigo"
          anonymized
          darkMode={darkMode}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Consultation Trend */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Tendances de consultation
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={consultationTrend}>
              <XAxis dataKey="period" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Line type="monotone" dataKey="consultations" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Age Distribution */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-purple-500" />
            Répartition par âge
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageDistribution}>
              <XAxis dataKey="range" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-yellow-500" />
          Alertes anonymisées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((alert) => (
            <AnonAlertCard key={alert.id} alert={alert} darkMode={darkMode} />
          ))}
        </div>
      </div>

      {/* Export */}
      <ExportPanel 
        darkMode={darkMode}
        dashboard="patients"
        description="Export des indicateurs patients agrégés et anonymisés"
      />
    </div>
  );
}