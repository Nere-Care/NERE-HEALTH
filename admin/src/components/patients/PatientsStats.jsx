import { Users, Activity, AlertTriangle, ClipboardList } from "lucide-react";

export default function PatientsStats({ darkMode, stats = null }) {
  const total        = stats?.total               ?? 0;
  const actifs       = stats?.actifs              ?? 0;
  const consultations= stats?.consultations_today ?? 0;
  const incomplets   = stats?.dossiers_incomplets ?? 0;

  const items = [
    { title: "Patients Totaux",            value: total.toLocaleString(),        icon: Users,          color: "blue"   },
    { title: "Consultations Aujourd'hui",  value: consultations.toLocaleString(), icon: Activity,       color: "green"  },
    { title: "Dossiers Incomplets",        value: incomplets.toLocaleString(),    icon: ClipboardList,  color: "orange" },
    { title: "Avec allergies",             value: (stats?.avec_allergies ?? 0).toLocaleString(), icon: AlertTriangle, color: "red" },
  ];

  const colorMap = {
    blue:   "bg-blue-600/10 text-blue-500",
    green:  "bg-green-600/10 text-green-500",
    orange: "bg-orange-600/10 text-orange-500",
    red:    "bg-red-600/10 text-red-500",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div key={i} className={`rounded-2xl p-5 border transition hover:shadow-lg
            ${darkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-gray-200 hover:border-gray-300"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{item.title}</p>
                {stats === null ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2" />
                ) : (
                  <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
                )}
              </div>
              <div className={`p-3 rounded-xl ${colorMap[item.color]}`}>
                <Icon size={28} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}