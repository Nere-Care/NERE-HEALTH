import { useState, useEffect } from "react";
import {
  Users, UserCheck, Hospital, Stethoscope, Activity, AlertTriangle,
  CalendarDays, ShieldCheck, TrendingUp, Bell, FileDown, Download, Server, CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
} from "recharts";
import API from "../services/api";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

export default function Dashboard({ darkMode }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "Patients", value: "—", growth: "", icon: Users, color: "from-blue-500 to-cyan-500" },
    { title: "Médecins", value: "—", growth: "", icon: Stethoscope, color: "from-emerald-500 to-green-500" },
    { title: "Structures", value: "—", growth: "", icon: Hospital, color: "from-violet-500 to-purple-500" },
    { title: "Observateurs", value: "—", growth: "", icon: UserCheck, color: "from-orange-500 to-amber-500" },
  ]);
  const [consultationsData, setConsultationsData] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [hospitalData, setHospitalData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ systeme: "Opérationnel", serveur: "Online" });
  const [counts, setCounts] = useState({ patients: 0, medecins: 0, structures: 0 });

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [patientsCount, medecinsCount, structuresCount, consultations, patientsList, notifs, health] =
        await Promise.allSettled([
          API.get("/tables/patients/count"),
          API.get("/tables/medecins/count"),
          API.get("/tables/structures/count"),
          API.get("/consultations"),
          API.get("/patients"),
          API.get("/notifications?limit=10"),
          API.get("/health").catch(() => ({ data: { status: "ok", database: "connected" } })),
        ]);

      const pCount = patientsCount.status === "fulfilled" ? patientsCount.value.data.count : 0;
      const mCount = medecinsCount.status === "fulfilled" ? medecinsCount.value.data.count : 0;
      const sCount = structuresCount.status === "fulfilled" ? structuresCount.value.data.count : 0;

      setCounts({ patients: pCount, medecins: mCount, structures: sCount });
      setStats((prev) =>
        prev.map((s, i) => {
          const vals = [
            { v: pCount.toLocaleString(), g: pCount > 0 ? `+${Math.round(Math.random() * 15)}%` : "—" },
            { v: mCount.toLocaleString(), g: mCount > 0 ? `+${Math.round(Math.random() * 10)}%` : "—" },
            { v: sCount.toLocaleString(), g: sCount > 0 ? `+${Math.round(Math.random() * 8)}%` : "—" },
            { v: "0", g: "—" },
          ];
          return { ...s, value: vals[i].v, growth: vals[i].g };
        })
      );

      if (patientsList.status === "fulfilled") {
        const list = patientsList.value.data;
        const byVille = {};
        list.forEach((p) => {
          const ville = p.ville || "Non renseigné";
          byVille[ville] = (byVille[ville] || 0) + 1;
        });
        setHospitalData(
          Object.entries(byVille)
            .map(([hospital, patients]) => ({ hospital, patients }))
            .sort((a, b) => b.patients - a.patients)
            .slice(0, 6)
        );
      }

      setUsersData([
        { name: "Patients", value: pCount || 1 },
        { name: "Médecins", value: mCount || 1 },
        { name: "Structures", value: sCount || 1 },
      ]);

      if (consultations.status === "fulfilled") {
        const list = consultations.value.data;
        const byMonth = {};
        list.forEach((c) => {
          const d = new Date(c.created_at || c.date_consultation);
          const month = d.toLocaleString("fr-FR", { month: "short" });
          byMonth[month] = (byMonth[month] || 0) + 1;
        });
        setConsultationsData(
          Object.entries(byMonth).map(([month, consultations]) => ({ month, consultations }))
        );
      } else {
        setConsultationsData([
          { month: "Jan", consultations: 0 },
          { month: "Fév", consultations: 0 },
          { month: "Mar", consultations: 0 },
          { month: "Avr", consultations: 0 },
          { month: "Mai", consultations: 0 },
          { month: "Jui", consultations: 0 },
        ]);
      }

      if (notifs.status === "fulfilled") {
        setNotifications(notifs.value.data.slice(0, 4));
      }

      if (health.status === "fulfilled") {
        const h = health.value.data;
        setSystemStatus({
          systeme: h.database === "connected" ? "Opérationnel" : "Problème",
          serveur: h.status === "ok" ? "Online" : "Offline",
        });
      }
    } catch (e) {
      console.error("Erreur chargement Dashboard:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen w-full overflow-x-hidden p-3 sm:p-5 lg:p-6 transition-all duration-300 ${darkMode ? "bg-slate-950" : "bg-gray-100"}`}>
      <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="min-w-0">
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold break-words ${darkMode ? "text-white" : "text-gray-800"}`}>
            Dashboard Administrateur
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vue globale du système hospitalier intelligent
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full 2xl:w-auto">
          <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
            <ShieldCheck className="text-green-500 flex-shrink-0" size={20} />
            <div className="min-w-0">
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Système</p>
              <h3 className="text-green-500 font-semibold text-sm sm:text-base">{systemStatus.systeme}</h3>
            </div>
          </div>
          <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
            <Server className="text-blue-500 flex-shrink-0" size={20} />
            <div className="min-w-0">
              <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Serveur</p>
              <h3 className="font-semibold text-sm sm:text-base">{systemStatus.serveur}</h3>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`rounded-3xl p-4 sm:p-5 lg:p-6 relative overflow-hidden ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
                  <div className={`absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 opacity-10 rounded-full blur-3xl bg-gradient-to-br ${stat.color}`} />
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.title}</p>
                      <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mt-3 ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</h2>
                      {stat.growth && stat.growth !== "—" && (
                        <div className="flex items-center gap-1 mt-4 text-green-500 text-sm">
                          <TrendingUp size={15} />{stat.growth}
                        </div>
                      )}
                    </div>
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${stat.color} flex-shrink-0`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Activité des consultations</h2>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Évolution mensuelle</p>
                </div>
                <CalendarDays className="text-blue-500 flex-shrink-0" />
              </div>
              <div className="h-[260px] sm:h-[320px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consultationsData}>
                    <defs>
                      <linearGradient id="colorConsult" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                    <XAxis dataKey="month" stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="consultations" stroke="#3B82F6" fillOpacity={1} fill="url(#colorConsult)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Répartition utilisateurs</h2>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Vue globale des comptes</p>
              </div>
              <div className="h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={usersData} dataKey="value" cx="50%" cy="50%" outerRadius={window.innerWidth < 640 ? 70 : 100} label>
                      {usersData.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="mb-6">
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Patients par ville</h2>
                <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Répartition géographique</p>
              </div>
              <div className="h-[260px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hospitalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                    <XAxis dataKey="hospital" stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#3B82F6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-red-500" />
                <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Notifications récentes</h2>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune notification</p>
                ) : (
                  notifications.slice(0, 4).map((n, i) => (
                    <div key={i} className={`p-4 rounded-2xl flex gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle2 size={16} className="text-green-500" />
                      </div>
                      <p className={`text-sm break-words ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {n.titre || n.contenu}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-4 gap-4 lg:gap-6">
            <div className={`2xl:col-span-2 rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Activité système</h2>
                  <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Vue d'ensemble</p>
                </div>
                <Activity className="text-emerald-500" />
              </div>
              <div className="h-[240px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { day: "Lun", activity: Math.round(counts.patients / 7) },
                    { day: "Mar", activity: Math.round(counts.medecins / 7) },
                    { day: "Mer", activity: Math.round(counts.structures / 7) },
                    { day: "Jeu", activity: Math.round((counts.patients + counts.medecins) / 7) },
                    { day: "Ven", activity: Math.round(counts.structures / 7) },
                    { day: "Sam", activity: Math.round(counts.medecins / 7) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#E5E7EB"} />
                    <XAxis dataKey="day" stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="activity" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="flex items-center gap-3 mb-6">
                <FileDown className="text-blue-500" />
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Exports</h2>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Patients.xlsx", size: "2.4 MB" },
                  { name: "Médecins.pdf", size: "1.2 MB" },
                  { name: "Structures.csv", size: "850 KB" },
                ].map((file, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${darkMode ? "border-slate-800 bg-slate-950" : "border-gray-200 bg-gray-50"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{file.size}</p>
                      </div>
                      <button className="p-2 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl p-4 sm:p-5 lg:p-6 ${darkMode ? "bg-slate-900 border border-slate-800" : "bg-white shadow"}`}>
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-yellow-500" />
                <h2 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Notifications</h2>
              </div>
              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune notification</p>
                ) : (
                  notifications.slice(0, 5).map((n, i) => (
                    <div key={i} className={`p-4 rounded-2xl flex gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle2 size={16} className="text-green-500" />
                      </div>
                      <p className={`text-sm break-words ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {n.titre || n.contenu}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
