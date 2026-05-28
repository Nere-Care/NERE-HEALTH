export default function AnonMetricCard({ metric, darkMode }) {
  const Icon = metric.icon;
  
  return (
    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
      darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
    }`}>
      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 truncate">{metric.label}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="font-bold">{metric.value}</p>
          {metric.trend && (
            <span className={`text-xs ${
              metric.trend.startsWith("+") ? "text-green-500" : "text-red-500"
            }`}>
              {metric.trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}