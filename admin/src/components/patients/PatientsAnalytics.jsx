import { Users, Activity, UserPlus, AlertCircle } from "lucide-react";

export default function PatientsAnalytics({ darkMode, patients = [] }) {
  // Correction: utilisation de 'statut' au lieu de 'status'
  const total = patients.length;
  const actifs = patients.filter(p => p.statut === "Actif").length;
  const nouveaux = patients.filter(p => p.derniereConnexion === "À l'instant" || p.derniereConnexion === "Aujourd'hui").length;
  const critiques = patients.filter(p => p.antecedents !== "Aucun").length;

  const stats = [
    { label: "Total patients", value: total, icon: Users, color: "blue" },
    { label: "Actifs", value: actifs, icon: Activity, color: "green" },
    { label: "Récents", value: nouveaux, icon: UserPlus, color: "purple" },
    { label: "À surveiller", value: critiques, icon: AlertCircle, color: "orange" },
  ];

  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className={`rounded-2xl p-5 ${darkMode ? "bg-slate-900" : "bg-white"} border ${darkMode ? "border-slate-800" : "border-gray-200"}`}>
      <h2 className="font-bold mb-4">Analytics Patients</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`}>
              <div className={`p-2.5 rounded-xl ${colorClasses[s.color]}`}>
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
    </div>
  );
}