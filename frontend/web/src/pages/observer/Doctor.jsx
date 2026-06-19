import { useMemo } from "react";
import { Stethoscope, Building2, Users, Activity, Award, AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

import AnonStatCard from "../../components/observers/AnonAlertCard";
import AnonMetricCard from "../../components/observers/AnonMetricCard";
import ExportPanel from "../../components/observers/ExportPanel";
import FilterPanel from "../../components/observers/FilterPanel";

/* ================= ANONYMIZED PROFESSIONALS DATA ================= */
const generateAnonProStats = () => ({
  totalProfessionals: Math.floor(Math.random() * 1000) + 4000,
  avgExperience: `${Math.floor(Math.random() * 10) + 8} ans`,
  specializationCount: Math.floor(Math.random() * 15) + 25,
  trainingCompletion: `${Math.floor(Math.random() * 20) + 75}%`,
});

const specialtyData = [
  { specialty: "Médecine G***", count: 1240 },
  { specialty: "Pédiatrie", count: 890 },
  { specialty: "Chirurgie", count: 650 },
  { specialty: "Autres", count: 2100 },
];

const workloadData = [
  { range: "<20h/semaine", count: 450 },
  { range: "20-40h", count: 2100 },
  { range: "40-60h", count: 1800 },
  { range: ">60h", count: 320 },
];

const metrics = [
  { label: "Consultations/mois", value: "145", icon: Activity, trend: "+8%" },
  { label: "Structures couvertes", value: "186", icon: Building2, trend: "+3%" },
  { label: "Formations validées", value: "89%", icon: Award, trend: "+12%" },
];

export default function ObserverProfessionalsDashboard({ darkMode }) {
  const stats = useMemo(() => generateAnonProStats(), []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="text-green-500" />
            Dashboard Professionnels
          </h2>
          <p className="text-sm text-gray-400">Données agrégées • Identités protégées</p>
        </div>
        <FilterPanel darkMode={darkMode} />
      </div>

      {/* Privacy Notice */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
        darkMode ? "bg-green-500/10 border-green-500/30" : "bg-green-50 border-green-200"
      }`}>
        <AlertCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="font-medium text-green-500">🔐 Confidentialité garantie</p>
          <p className="text-sm text-gray-400">
            Les noms, contacts et identifiants des professionnels sont masqués. 
            Seules les données statistiques agrégées sont accessibles.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AnonStatCard
          label="Professionnels actifs"
          value={stats.totalProfessionals.toLocaleString()}
          icon={Users}
          color="green"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Expérience moyenne"
          value={stats.avgExperience}
          icon={Award}
          color="blue"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Spécialités"
          value={stats.specializationCount}
          icon={Stethoscope}
          color="purple"
          anonymized
          darkMode={darkMode}
        />
        <AnonStatCard
          label="Formations complétées"
          value={stats.trainingCompletion}
          icon={Activity}
          color="indigo"
          anonymized
          darkMode={darkMode}
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <AnonMetricCard key={i} metric={m} darkMode={darkMode} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Specialty Distribution */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4">Répartition par spécialité</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={specialtyData} layout="vertical">
              <XAxis type="number" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <YAxis dataKey="specialty" type="category" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={11} width={120} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Distribution */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <h3 className="font-semibold mb-4">Charge de travail hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={workloadData}>
              <XAxis dataKey="range" stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={10} angle={-15} textAnchor="end" height={70} />
              <YAxis stroke={darkMode ? "#64748b" : "#94a3b8"} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1e293b" : "#fff", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Export */}
      <ExportPanel 
        darkMode={darkMode}
        dashboard="professionals"
        description="Export des indicateurs professionnels agrégés et anonymisés"
      />
    </div>
  );
}