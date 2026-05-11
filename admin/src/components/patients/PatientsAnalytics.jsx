import { Users, UserPlus, Activity, AlertCircle } from "lucide-react";

export default function PatientsAnalytics({ darkMode, patients = [] }) {

  const total = patients.length;
  const actifs = patients.filter(p => p.status === "Actif").length;
  const nouveaux = patients.filter(p => p.nouveau === true).length;
  const critiques = patients.filter(p => p.etat === "Critique").length;

  const stats = [
    { label: "Total patients", value: total, icon: Users },
    { label: "Actifs", value: actifs, icon: Activity },
    { label: "Nouveaux", value: nouveaux, icon: UserPlus },
    { label: "Critiques", value: critiques, icon: AlertCircle },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-2xl shadow flex items-center gap-3 ${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="font-bold text-lg">{s.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}