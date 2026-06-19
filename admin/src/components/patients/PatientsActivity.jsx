export default function PatientsActivity({ darkMode, activities = [] }) {
  const defaultActivities = [
    { id: 1, action: "📋 Nouvelle consultation", patient: "Sarah Ndzi", time: "Il y a 5 min" },
    { id: 2, action: "✏️ Mise à jour dossier", patient: "Paul Tchoumi", time: "Il y a 1h" },
    { id: 3, action: "➕ Patient ajouté", patient: "Brigitte Essomba", time: "Il y a 3h" },
    { id: 4, action: "🔬 Résultat labo", patient: "Armand Ekani", time: "Il y a 5h" },
  ];
  
  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className={`rounded-2xl shadow p-5 h-full ${darkMode ? "bg-slate-900 text-white border border-slate-800" : "bg-white border border-gray-200"}`}>
      <h2 className="font-bold mb-4">🕐 Activité récente</h2>
      <div className="flex flex-col gap-3">
        {displayActivities.map((a) => (
          <div key={a.id} className={`p-3 rounded-xl flex justify-between items-center transition ${
            darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-50 hover:bg-gray-100"
          }`}>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{a.action}</p>
              <p className="text-xs text-gray-400 truncate">{a.patient}</p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}