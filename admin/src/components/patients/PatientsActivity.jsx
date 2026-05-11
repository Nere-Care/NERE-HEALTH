export default function PatientsActivity({ darkMode, activities = [] }) {
  return (
    <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}>

      <h2 className="font-bold mb-4">Activité récente</h2>

      <div className="flex flex-col gap-3">
        {activities.map((a, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl flex justify-between items-center ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div>
              <p className="text-sm font-semibold">{a.action}</p>
              <p className="text-xs text-gray-400">{a.patient}</p>
            </div>

            <span className="text-xs text-gray-400">{a.time}</span>
          </div>
        ))}
      </div>

    </div>
  );
}