import { useMemo } from "react";
import { Building2, MapPin, Users, Activity, Shield, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

import AnonStatCard from "../../components/observers/AnonAlertCard";
import ExportPanel from "../../components/observers/ExportPanel";
import FilterPanel from "../../components/observers/FilterPanel";

/* ================= ANONYMIZED STRUCTURES DATA ================= */
const generateAnonStructStats = () => ({
  totalStructures: Math.floor(Math.random() * 50) + 200,
  avgCapacity: Math.floor(Math.random() * 100) + 150,
  equipmentRate: `${Math.floor(Math.random() * 25) + 70}%`,
  connectivityRate: `${Math.floor(Math.random() * 30) + 60}%`,
});

const typeData = [
  { type: "Hôpital public", count: 85 },
  { type: "Clinique privée", count: 62 },
  { type: "CHU", count: 28 },
  { type: "Centre de santé", count: 145 },
].map(d => ({ ...d, type: d.type.replace(/[\w\s]+/g, m => m.split(' ')[0] + "***") }));

const regionData = [
  { region: "L***", capacity: 4200 },
  { region: "C***", capacity: 3100 },
  { region: "N***", capacity: 1800 },
  { region: "O***", capacity: 1200 },
  { region: "S***", capacity: 900 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ObserverStructuresDashboard({ darkMode }) {
  const stats = useMemo(() => generateAnonStructStats(), []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="text-indigo-500" />
            Dashboard Structures
          </h2>
          <p className="text-sm text-gray-400">Données d'établissements agrégées • Localisation approximative</p>
        </div>
        <FilterPanel darkMode={darkMode} />
      </div>

      {/* Privacy Notice */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        darkMode ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-200"
      }`}>
        <Shield className="text-indigo-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-indigo-500">🗺️ Données géographiques anonymisées</p>
          <p className="text-sm text-gray-400">
            Les adresses exactes sont masquées. Seules les régions (partiellement anonymisées) 
            et les statistiques agrégées sont visibles.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnonStatCard
          label="Structures actives"
          value={stats.totalStructures}
          icon={Building2}
          color="indigo"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Capacité moyenne"
          value={stats.avgCapacity}
          icon={Users}
          color="blue"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Équipement"
          value={stats.equipmentRate}
          icon={Activity}
          color="green"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Connectivité"
          value={stats.connectivityRate}
          icon={MapPin}
          color="purple"
          anonymized
          darkMode={darkMode}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Type Distribution */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie 
                data={typeData} 
                dataKey="count" 
                nameKey="type"
                cx="50%" 
                cy="50%" 
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {typeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Capacity */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4">Capacité par région</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionData}>
              <XAxis dataKey="region" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="capacity" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-yellow-500" />
          Points d'attention
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Connectivité faible", value: "23 structures", severity: "medium" },
            { label: "Équipement obsolète", value: "18 structures", severity: "low" },
            { label: "Personnel insuffisant", value: "31 structures", severity: "medium" },
            { label: "Maintenance requise", value: "12 structures", severity: "low" },
          ].map((item, i) => (
            <div key={i} className={`p-3 rounded-lg border-l-4 ${
              item.severity === "medium" ? "border-yellow-500" : "border-gray-400"
            } ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-xs text-gray-400">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <ExportPanel 
        darkMode={darkMode}
        dashboard="structures"
        description="Export des indicateurs structures agrégés et anonymisés"
      />
    </div>
  );
}