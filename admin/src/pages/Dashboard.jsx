import {
  Users,
  UserCheck,
  Hospital,
  Stethoscope,
  Activity,
  AlertTriangle,
  CalendarDays,
  ShieldCheck,
  TrendingUp,
  Bell,
  FileDown,
  Download,
  Server,
  CheckCircle2,
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

/* ================= MOCK DATA ================= */

const stats = [
  {
    title: "Patients",
    value: "12,450",
    growth: "+12%",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
  },

  {
    title: "Médecins",
    value: "1,250",
    growth: "+8%",
    icon: Stethoscope,
    color: "from-emerald-500 to-green-500",
  },

  {
    title: "Structures",
    value: "85",
    growth: "+5%",
    icon: Hospital,
    color: "from-violet-500 to-purple-500",
  },

  {
    title: "Observateurs",
    value: "340",
    growth: "+15%",
    icon: UserCheck,
    color: "from-orange-500 to-amber-500",
  },
];

const consultationsData = [
  { month: "Jan", consultations: 400 },
  { month: "Feb", consultations: 700 },
  { month: "Mar", consultations: 900 },
  { month: "Apr", consultations: 1200 },
  { month: "May", consultations: 1600 },
  { month: "Jun", consultations: 1900 },
];

const usersData = [
  { name: "Patients", value: 12450 },
  { name: "Médecins", value: 1250 },
  { name: "Observateurs", value: 340 },
  { name: "Admins", value: 45 },
];

const hospitalData = [
  { hospital: "Douala", patients: 4000 },
  { hospital: "Yaoundé", patients: 3500 },
  { hospital: "Bafoussam", patients: 1800 },
  { hospital: "Garoua", patients: 1200 },
];

const activityData = [
  { day: "Lun", activity: 120 },
  { day: "Mar", activity: 210 },
  { day: "Mer", activity: 180 },
  { day: "Jeu", activity: 320 },
  { day: "Ven", activity: 280 },
  { day: "Sam", activity: 190 },
];

const alerts = [
  {
    title: "Tentatives de connexion suspectes",
    level: "Critique",
    time: "Il y a 5 min",
  },

  {
    title: "Serveur API à 85% d'utilisation",
    level: "Moyen",
    time: "Il y a 18 min",
  },

  {
    title: "Nouvelle structure en attente",
    level: "Info",
    time: "Il y a 30 min",
  },

  {
    title: "Sauvegarde système réussie",
    level: "Succès",
    time: "Aujourd'hui",
  },
];

const notifications = [
  "3 nouveaux médecins ont soumis leurs documents",
  "Export des patients terminé avec succès",
  "Nouvel observateur ajouté dans le système",
  "5 nouvelles consultations enregistrées",
];

const exportsData = [
  {
    name: "Patients.xlsx",
    size: "2.4 MB",
    status: "Téléchargé",
  },

  {
    name: "Doctors.pdf",
    size: "1.2 MB",
    status: "Disponible",
  },

  {
    name: "Hospitals.csv",
    size: "850 KB",
    status: "Disponible",
  },
];

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
];

/* ================= COMPONENT ================= */

export default function Dashboard({ darkMode }) {
  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden p-3 sm:p-5 lg:p-6 transition-all duration-300
      ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}
    >
      {/* ================= HEADER ================= */}

      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="min-w-0">
          <h1
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold break-words
            ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            Dashboard Administrateur
          </h1>

          <p
            className={`mt-2 text-sm sm:text-base
            ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            Vue globale du système hospitalier intelligent
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full 2xl:w-auto">
          <div
            className={`px-4 py-3 rounded-2xl flex items-center gap-3
            ${
              darkMode
                ? "bg-slate-900 border border-slate-800"
                : "bg-white shadow"
            }`}
          >
            <ShieldCheck
              className="text-green-500 flex-shrink-0"
              size={20}
            />

            <div className="min-w-0">
              <p
                className={`text-xs
                ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Système
              </p>

              <h3 className="text-green-500 font-semibold text-sm sm:text-base">
                Opérationnel
              </h3>
            </div>
          </div>

          <div
            className={`px-4 py-3 rounded-2xl flex items-center gap-3
            ${
              darkMode
                ? "bg-slate-900 border border-slate-800"
                : "bg-white shadow"
            }`}
          >
            <Server
              className="text-blue-500 flex-shrink-0"
              size={20}
            />

            <div className="min-w-0">
              <p
                className={`text-xs
                ${darkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                Serveur
              </p>

              <h3 className="font-semibold text-sm sm:text-base">
                Online
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ================= GLOBAL STATS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden
              ${
                darkMode
                  ? "bg-slate-900 border border-slate-800"
                  : "bg-white shadow"
              }`}
            >
              <div
                className={`absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br ${stat.color}`}
              />

              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p
                    className={`text-sm
                    ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    {stat.title}
                  </p>

                  <h2
                    className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3
                    ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {stat.value}
                  </h2>

                  <div className="flex items-center gap-1 mt-4 text-green-500 text-sm">
                    <TrendingUp size={15} />
                    {stat.growth}
                  </div>
                </div>

                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} flex-shrink-0`}
                >
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MAIN GRID ================= */}

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* CONSULTATIONS */}

        <div
          className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Activité des consultations
              </h2>

              <p
                className={`text-sm mt-1
                ${
                  darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Évolution mensuelle
              </p>
            </div>

            <CalendarDays
              className="text-blue-500 flex-shrink-0"
            />
          </div>

          <div className="h-[260px] sm:h-[320px] lg:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={consultationsData}>
                <defs>
                  <linearGradient
                    id="colorConsult"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#3B82F6"
                      stopOpacity={0.8}
                    />

                    <stop
                      offset="95%"
                      stopColor="#3B82F6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />

                <XAxis
                  dataKey="month"
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="consultations"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#colorConsult)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USERS PIE */}

        <div
          className={`rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="mb-6">
            <h2
              className={`text-lg sm:text-xl font-bold
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              Répartition utilisateurs
            </h2>

            <p
              className={`text-sm mt-1
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Vue globale des comptes
            </p>
          </div>

          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={usersData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={window.innerWidth < 640 ? 70 : 100}
                  label
                >
                  {usersData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= SECOND GRID ================= */}

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* BAR CHART */}

        <div
          className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="mb-6">
            <h2
              className={`text-lg sm:text-xl font-bold
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              Patients par ville
            </h2>

            <p
              className={`text-sm mt-1
              ${
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Répartition géographique
            </p>
          </div>

          <div className="h-[260px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />

                <XAxis
                  dataKey="hospital"
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Bar
                  dataKey="patients"
                  fill="#3B82F6"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALERTS */}

        <div
          className={`rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="text-red-500" />

            <h2
              className={`text-lg sm:text-xl font-bold
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              Alertes système
            </h2>
          </div>

          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl
                ${
                  darkMode
                    ? "bg-slate-800"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold">
                    {alert.level}
                  </span>

                  <span className="text-xs text-gray-400">
                    {alert.time}
                  </span>
                </div>

                <p
                  className={`text-sm break-words
                  ${
                    darkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  {alert.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= THIRD GRID ================= */}

      <div className="grid grid-cols-1 2xl:grid-cols-4 gap-4 lg:gap-6">
        {/* SYSTEM ACTIVITY */}

        <div
          className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold
                ${
                  darkMode
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                Activité système
              </h2>

              <p
                className={`text-sm mt-1
                ${
                  darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Activité quotidienne
              </p>
            </div>

            <Activity className="text-emerald-500" />
          </div>

          <div className="h-[240px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={darkMode ? "#374151" : "#E5E7EB"}
                />

                <XAxis
                  dataKey="day"
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  stroke={darkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="activity"
                  stroke="#10B981"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* EXPORTS */}

        <div
          className={`rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <FileDown className="text-blue-500" />

            <h2
              className={`text-lg font-bold
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              Exports
            </h2>
          </div>

          <div className="space-y-4">
            {exportsData.map((file, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl border
                ${
                  darkMode
                    ? "border-slate-800 bg-slate-950"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {file.size}
                    </p>
                  </div>

                  <button className="p-2 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}

        <div
          className={`rounded-3xl p-4 sm:p-5 lg:p-6
          ${
            darkMode
              ? "bg-slate-900 border border-slate-800"
              : "bg-white shadow"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-yellow-500" />

            <h2
              className={`text-lg font-bold
              ${
                darkMode
                  ? "text-white"
                  : "text-gray-800"
              }`}
            >
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            {notifications.map((notif, index) => (
              <div
                key={index}
                className={`p-4 rounded-2xl flex gap-3
                ${
                  darkMode
                    ? "bg-slate-800"
                    : "bg-gray-50"
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle2
                    size={16}
                    className="text-green-500"
                  />
                </div>

                <p
                  className={`text-sm break-words
                  ${
                    darkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  {notif}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}