import { Users, Activity, UserPlus, AlertCircle } from "lucide-react";

export default function PatientsAnalytics({ darkMode, stats = null }) {
  const items = [
    { label: "Total patients",  value: stats?.total             ?? 0, icon: Users,        color: "blue"   },
    { label: "Actifs",          value: stats?.actifs            ?? 0, icon: Activity,     color: "green"  },
    { label: "Nouveaux (7j)",   value: stats?.nouveaux_semaine  ?? 0, icon: UserPlus,     color: "purple" },
    { label: "Avec allergies",  value: stats?.avec_allergies    ?? 0, icon: AlertCircle,  color: "orange" },
  ];

  const colorClasses = {
    blue:   "bg-blue-100 text-blue-600",
    green:  "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className={`rounded-2xl p-5 border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
      <h2 className="font-bold mb-4">Analytics Patients</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <div className={`p-2.5 rounded-xl ${colorClasses[s.color]}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{s.label}</p>
                {stats === null ? (
                  <div className="h-6 w-10 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className="font-bold text-lg">{s.value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}