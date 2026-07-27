import { useState, useEffect } from "react";
import {
  Users,
  Stethoscope,
  Hospital,
  UserCheck,
  Activity,
  AlertTriangle,
  CalendarDays,
  ShieldCheck,
  Server,
  TrendingUp,
  Download,
  Bell,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { fetchDashboardData } from "../services/DashboardService";

// Couleurs modernes pour les graphiques
const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

// Composant Tooltip personnalisé pour un look "Pro"
const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-3 rounded-xl shadow-xl border text-sm ${
          darkMode
            ? "bg-slate-900 border-slate-700 text-white"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((pld, index) => (
          <p
            key={index}
            style={{ color: pld.color }}
            className="font-medium"
          >
            {pld.name}: {pld.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Composant Skeleton pour le chargement
const StatSkeleton = ({ darkMode }) => (
  <div
    className={`rounded-3xl p-6 animate-pulse ${
      darkMode ? "bg-slate-900" : "bg-white"
    }`}
  >
    <div className="h-4 w-24 bg-gray-300 dark:bg-slate-700 rounded mb-4" />
    <div className="h-8 w-32 bg-gray-300 dark:bg-slate-700 rounded mb-4" />
    <div className="h-4 w-16 bg-gray-300 dark:bg-slate-700 rounded" />
  </div>
);

export default function Dashboard({ darkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Appel réel au backend
        const response = await fetchDashboardData();
        setData(response);
      } catch (err) {
        setError(
          "Impossible de charger les données. Vérifiez la connexion au backend."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = data?.stats || [];
  const charts = data?.charts || {};

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
        darkMode ? "bg-slate-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Tableau de Bord
          </h1>
          <p
            className={`mt-2 text-sm lg:text-base ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Vue globale et temps réel de l'écosystème Néré Health.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div
            className={`px-4 py-3 rounded-2xl flex items-center gap-3 border ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-gray-200 shadow-sm"
            }`}
          >
            <div className="p-2 rounded-full bg-green-500/10">
              <ShieldCheck className="text-green-500" size={20} />
            </div>
            <div>
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Système
              </p>
              <h3 className="text-green-500 font-bold text-sm">
                Opérationnel
              </h3>
            </div>
          </div>
          <div
            className={`px-4 py-3 rounded-2xl flex items-center gap-3 border ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-gray-200 shadow-sm"
            }`}
          >
            <div className="p-2 rounded-full bg-blue-500/10">
              <Server className="text-blue-500" size={20} />
            </div>
            <div>
              <p
                className={`text-xs ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                API Latence
              </p>
              <h3 className="font-bold text-sm">24ms</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GLOBAL STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <StatSkeleton key={i} darkMode={darkMode} />)
        ) : error ? (
          <div className="col-span-full p-6 text-center text-red-500 bg-red-500/10 rounded-2xl">
            {error}
          </div>
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                    : "bg-white border-gray-200 hover:border-blue-200"
                }`}
              >
                <div
                  className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${stat.color} group-hover:opacity-30 transition-opacity`}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {stat.title}
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-extrabold mt-2 tracking-tight">
                      {stat.value}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-3 text-emerald-500 text-sm font-semibold bg-emerald-500/10 w-fit px-2 py-1 rounded-lg">
                      <TrendingUp size={14} /> {stat.growth}
                    </div>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} shadow-lg`}
                  >
                    <Icon className="text-white" size={26} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= MAIN CHARTS GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Area Chart: Consultations */}
        <div
          className={`xl:col-span-2 rounded-3xl p-6 border ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Activité des consultations</h2>
              <p
                className={`text-sm mt-1 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Évolution sur les 6 derniers mois
              </p>
            </div>
            <CalendarDays className="text-blue-500 opacity-80" />
          </div>
          <div className="h-[300px] lg:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.consultations || []}>
                <defs>
                  <linearGradient
                    id="colorConsult"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#1e293b" : "#f1f5f9"}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke={darkMode ? "#64748b" : "#94a3b8"}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke={darkMode ? "#64748b" : "#94a3b8"}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorConsult)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Users */}
        <div
          className={`rounded-3xl p-6 border ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold">Répartition utilisateurs</h2>
            <p
              className={`text-sm mt-1 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Vue globale des comptes actifs
            </p>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.users || []}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  cornerRadius={10}
                >
                  {(charts.users || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Légende personnalisée */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(charts.users || []).map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span
                  className={darkMode ? "text-gray-300" : "text-gray-600"}
                >
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alerts */}
        <div
          className={`rounded-3xl p-6 border ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-red-500/10">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <h2 className="text-xl font-bold">Alertes récentes</h2>
          </div>
          <div className="space-y-4">
            {(charts.alerts || []).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border-l-4 transition-all hover:scale-[1.02] ${
                  alert.level === "Critique"
                    ? "border-red-500 bg-red-500/5"
                    : alert.level === "Moyen"
                    ? "border-yellow-500 bg-yellow-500/5"
                    : "border-blue-500 bg-blue-500/5"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      alert.level === "Critique"
                        ? "bg-red-500 text-white"
                        : alert.level === "Moyen"
                        ? "bg-yellow-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {alert.level}
                  </span>
                  <span
                    className={`text-xs ${
                      darkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {alert.time}
                  </span>
                </div>
                <p
                  className={`text-sm font-medium mt-2 ${
                    darkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {alert.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Exports combined widget */}
        <div
          className={`xl:col-span-2 rounded-3xl p-6 border ${
            darkMode
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-gray-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Bell className="text-purple-500" size={20} />
              </div>
              <h2 className="text-xl font-bold">Activité & Exports</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notifications List */}
            <div className="space-y-3">
              <h3
                className={`text-sm font-semibold uppercase tracking-wider ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Dernières notifications
              </h3>
              {(charts.notifications || []).map((notif, index) => (
                <div
                  key={index}
                  className={`flex gap-3 p-3 rounded-xl ${
                    darkMode ? "bg-slate-800/50" : "bg-gray-50"
                  }`}
                >
                  <CheckCircle2
                    size={18}
                    className="text-emerald-500 flex-shrink-0 mt-0.5"
                  />
                  <p
                    className={`text-sm leading-snug ${
                      darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {notif}
                  </p>
                </div>
              ))}
            </div>

            {/* Exports List */}
            <div className="space-y-3">
              <h3
                className={`text-sm font-semibold uppercase tracking-wider ${
                  darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Exports disponibles
              </h3>
              {(charts.exports || []).map((file, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    darkMode
                      ? "border-slate-700 bg-slate-800/30"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {file.size} • {file.status}
                    </p>
                  </div>
                  <button className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex-shrink-0">
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}