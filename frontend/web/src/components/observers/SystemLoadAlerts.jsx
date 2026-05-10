import { AlertTriangle } from "lucide-react";

export default function SystemLoadAlerts({ darkMode }) {
  const alerts = [
    { zone: "Douala", level: "High outbreak risk" },
    { zone: "Yaoundé", level: "Moderate alert" },
  ];

  return (
    <div
      className={`p-4 rounded-xl border transition
      ${
        darkMode
          ? "bg-gray-900 border-gray-800"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold">Critical Alerts</h3>
      </div>

      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.zone}
            className={`p-3 rounded-lg text-sm border-l-4 border-red-500
            ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
          >
            <p className="font-semibold">{a.zone}</p>
            <p className="text-red-500 text-xs">{a.level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}