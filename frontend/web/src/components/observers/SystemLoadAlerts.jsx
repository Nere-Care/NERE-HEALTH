export default function SystemLoadAlerts({ darkMode }) {
  const alerts = [
    { zone: "Douala", level: "High risk outbreak" },
    { zone: "Yaoundé", level: "Moderate alert" },
  ];

  return (
    <div className={`p-4 rounded-xl border
      ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
    `}>

      <h3 className="font-semibold mb-3">Health Alerts</h3>

      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.zone}
            className={`p-3 rounded-lg text-sm
            ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}
          >
            <p className="font-medium">{a.zone}</p>
            <p className="text-red-500">{a.level}</p>
          </div>
        ))}
      </div>

    </div>
  );
}