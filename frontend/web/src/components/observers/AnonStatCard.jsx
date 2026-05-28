export default function AnonStatCard({ label, value, icon: Icon, color, anonymized, darkMode }) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
    purple: "bg-purple-500/10 text-purple-500",
    indigo: "bg-indigo-500/10 text-indigo-500",
    red: "bg-red-500/10 text-red-500",
  };

  return (
    <div className={`rounded-2xl p-4 border transition hover:shadow-md ${
      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-400 truncate">{label}</p>
          <p className="text-2xl font-bold mt-1 truncate">{value}</p>
          {anonymized && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              Données agrégées
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}