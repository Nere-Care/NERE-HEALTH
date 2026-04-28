export default function GlobalStats({ darkMode }) {
  const stats = [
    { label: "Total Patients", value: "1.2M" },
    { label: "Active Diseases", value: "24" },
    { label: "Critical Cases", value: "3,450" },
    { label: "Vaccination Rate", value: "78%" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

      {stats.map((s) => (
        <div
          key={s.label}
          className={`p-4 rounded-xl border shadow-sm
          ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {s.label}
          </p>
          <p className="text-xl font-bold text-blue-500">
            {s.value}
          </p>
        </div>
      ))}

    </div>
  );
}