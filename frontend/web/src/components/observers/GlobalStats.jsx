import { Users, Activity, AlertCircle, ShieldCheck } from "lucide-react";

export default function GlobalStats({ darkMode }) {
  const stats = [
    {
      label: "Total Patients Monitored",
      value: "1.2M",
      icon: Users,
    },
    {
      label: "Active Epidemics",
      value: "24",
      icon: Activity,
    },
    {
      label: "Critical Alerts",
      value: "3,450",
      icon: AlertCircle,
    },
    {
      label: "Vaccination Coverage",
      value: "78%",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;

        return (
          <div
            key={s.label}
            className={`rounded-xl border p-4 transition hover:shadow-md
            ${
              darkMode
                ? "bg-gray-900 border-gray-800"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center gap-2 text-gray-500">
              <Icon className="w-4 h-4" />
              <p className="text-xs">{s.label}</p>
            </div>

            <p className="text-2xl font-bold mt-2 text-blue-500">
              {s.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}