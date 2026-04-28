export default function StatCards() {
  const stats = [
    { label: "Total Patients", value: 12450 },
    { label: "Consultations", value: 38900 },
    { label: "Vaccinations", value: 22000 },
    { label: "Critical Cases", value: 340 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border dark:border-gray-800"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {s.value}
          </p>
        </div>
      ))}

    </div>
  );
}