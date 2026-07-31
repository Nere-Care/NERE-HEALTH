export default function PatientsActivity({ darkMode, activities = [] }) {
  return (
    <div className={`rounded-2xl shadow p-5 h-full ${darkMode ? "bg-slate-900 text-white border border-slate-800" : "bg-white border border-gray-200"}`}>
      <h2 className="font-bold mb-4">🕐 Activité récente</h2>
      <div className="flex flex-col gap-3">
        {activities.length > 0 ? (
          activities.map((a) => (
            <div key={a.id} className={`p-3 rounded-xl flex justify-between items-center transition ${
              darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-gray-50 hover:bg-gray-100"
            }`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{a.action}</p>
                <p className="text-xs text-gray-400 truncate">{a.patient}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{a.time}</span>
            </div>
          ))
        ) : (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucune activité récente</p>
        )}
      </div>
    </div>
  );
}