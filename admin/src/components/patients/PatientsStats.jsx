import {
  Users,
  Activity,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

export default function PatientsStats({ darkMode }) {
  const stats = [
    {
      title: "Patients Totaux",
      value: "2,540",
      icon: Users,
    },
    {
      title: "Consultations Aujourd'hui",
      value: "182",
      icon: Activity,
    },
    {
      title: "Dossiers Incomplets",
      value: "31",
      icon: ClipboardList,
    },
    {
      title: "Patients Critiques",
      value: "12",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {stats.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            className={`rounded-2xl p-5 border ${
              darkMode
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{item.title}</p>
                <h2 className="text-3xl font-bold mt-2">{item.value}</h2>
              </div>

              <div className="p-3 rounded-xl bg-blue-600/10 text-blue-500">
                <Icon size={28} />
              </div>
            </div>
          </div>
        );
      })}
   </div>
  );
}   