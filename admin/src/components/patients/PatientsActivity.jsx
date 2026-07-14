export default function PatientsActivity({ darkMode, activities = null }) {
  const isLoading = activities === null;

  const ICONES = {
    "Nouvelle consultation": "🩺",
    "Demande de RDV":        "📅",
    "Patient ajouté":        "➕",
    "Mise à jour dossier":   "✏️",
  };

  return (
    <div className={`rounded-2xl shadow p-5 h-full border
      ${darkMode ? "bg-slate-900 text-white border-slate-800" : "bg-white border-gray-200"}`}>
      <h2 className="font-bold mb-4">Activité récente (24h)</h2>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className={`p-3 rounded-xl animate-pulse h-14 ${darkMode ? "bg-slate-800" : "bg-gray-50"}`} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className={`text-center py-8 text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Aucune activité dans les dernières 24h
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activities.map((a, i) => (
            <div key={a.id || i} className={`p-3 rounded-xl flex justify-between items-center transition
              ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-50 hover:bg-gray-100"}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {ICONES[a.action] || "📋"} {a.action}
                </p>
                <p className="text-xs text-gray-400 truncate">{a.patient}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{a.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}