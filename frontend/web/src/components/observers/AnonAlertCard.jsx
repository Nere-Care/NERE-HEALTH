export default function AnonAlertCard({
  alert = {},
  darkMode = false,
}) {

  const severityStyles = {
    low: "border-gray-400 text-gray-400",
    medium: "border-yellow-500 text-yellow-500",
    high: "border-red-500 text-red-500",
  };

  const severity = alert?.severity || "low";

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${
        severityStyles[severity]
      } ${
        darkMode
          ? "bg-slate-800"
          : "bg-gray-50"
      }`}
    >
      <p
        className="font-medium text-sm truncate"
        title={alert?.type || "Alerte"}
      >
        {alert?.type || "Alerte inconnue"}
      </p>

      <p className="text-xs text-gray-400 mt-1">
        {alert?.count || 0} cas signalés
      </p>

      <p className="text-xs text-gray-500 mt-1">
        🔒 Anonymisé
      </p>
    </div>
  );
}