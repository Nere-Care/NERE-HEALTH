import {
  Shield,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  Edit,
  Building2,
} from "lucide-react";

export default function ObserverCard({
  observer,
  darkMode,
  cardClass,
  onView,
  onToggleStatus,
  onExport,
  onDelete,
  getStatusBadge,
  getRiskColor,
}) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border space-y-4 transition hover:shadow-lg overflow-hidden ${cardClass} ${
        darkMode ? "hover:border-slate-700" : "hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`p-2.5 rounded-xl flex-shrink-0 ${
            darkMode ? "bg-blue-500/10" : "bg-blue-50"
          }`}
        >
          <Shield className="text-blue-500" size={20} />
        </div>

        <div className="flex-shrink-0 max-w-[120px] sm:max-w-none">
          {getStatusBadge(observer.status)}
        </div>
      </div>

      {/* Title */}
      <div className="min-w-0 overflow-hidden">
        <h2
          className="font-bold text-base sm:text-lg truncate"
          title={observer.name}
        >
          {observer.name}
        </h2>

        <p
          className="text-sm text-gray-400 truncate"
          title={observer.scope}
        >
          {observer.scope}
        </p>

        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 min-w-0">
          <Building2 size={12} className="flex-shrink-0" />

          <span className="truncate">{observer.role}</span>
        </p>
      </div>

      {/* Data Monitoring */}
      <div className="text-sm space-y-2 min-w-0">
        <div className="flex items-center gap-2 text-gray-400 min-w-0">
          <Users size={14} className="flex-shrink-0" />

          <span className="truncate">
            Patients:{" "}
            <strong
              className={darkMode ? "text-white" : "text-gray-900"}
            >
              {observer.watched.patients.toLocaleString()}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <Activity
            size={14}
            className={`flex-shrink-0 ${getRiskColor(
              observer.watched.activityRisk
            )}`}
          />

          <span className="truncate">
            Risque:{" "}
            <strong
              className={getRiskColor(
                observer.watched.activityRisk
              )}
            >
              {observer.watched.activityRisk}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-400 min-w-0">
          <Clock size={14} className="flex-shrink-0" />

          <span className="truncate">
            Sync: {observer.lastSync}
          </span>
        </div>

        {observer.alerts > 0 && (
          <div className="flex items-center gap-2 text-red-400 min-w-0">
            <AlertTriangle size={14} className="flex-shrink-0" />

            <span className="truncate">
              Alertes: <strong>{observer.alerts}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t dark:border-slate-800">
        <button
          onClick={onView}
          className={`flex-1 w-full sm:w-auto min-w-[80px] py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
            darkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"
          }`}
          title="Voir détails"
        >
          <Eye size={14} className="flex-shrink-0" />

          <span className="hidden sm:inline">Voir</span>

          <span className="sm:hidden">Détails</span>
        </button>

        <button
          onClick={onToggleStatus}
          className={`flex-1 w-full sm:w-auto min-w-[80px] py-2 rounded-xl text-sm font-medium transition flex items-center justify-center gap-1.5 ${
            observer.status === "Actif"
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
          }`}
          title={
            observer.status === "Actif"
              ? "Suspendre"
              : "Activer"
          }
        >
          <Edit size={14} className="flex-shrink-0" />

          <span className="hidden md:inline">
            {observer.status === "Actif"
              ? "Suspendre"
              : "Activer"}
          </span>

          <span className="md:hidden">
            {observer.status === "Actif"
              ? "Stop"
              : "On"}
          </span>
        </button>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onExport}
            className="flex-1 sm:flex-none p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition flex items-center justify-center"
            title="Exporter"
          >
            <Download size={16} />
          </button>

          <button
            onClick={onDelete}
            className="flex-1 sm:flex-none p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition flex items-center justify-center"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}