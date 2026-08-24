import { Users, UserPlus, AlertCircle, Ban } from "lucide-react";

export default function PatientsAnalytics({ darkMode, patients = [], stats = {}, statusCounts = {} }) {
  const actifs = statusCounts.actif ?? stats.actifs ?? patients.filter(p => p.statut === "Actif").length;
  const recents = stats.recents ?? 0;
  const suspendus = statusCounts.suspendu ?? 0;
  const bannis = statusCounts.banni ?? 0;

  const statsItems = [
    { label: "Actifs", value: actifs, icon: Users, color: "blue" },
    { label: "Récents (7 jours)", value: recents, icon: UserPlus, color: "purple" },
    { label: "Suspendus", value: suspendus, icon: AlertCircle, color: "orange" },
    { label: "Bannis", value: bannis, icon: Ban, color: "red" },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className={`rounded-2xl p-5 ${darkMode ? "bg-slate-900" : "bg-white"} border ${darkMode ? "border-slate-800" : "border-gray-200"}`}>
      <h2 className="font-bold mb-4">Analytics Patients</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${colorClasses[s.color]}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="font-bold text-lg">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
