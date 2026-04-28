import { patients } from "../../../constants/doctors/DasboardData";

export default function RecentPatients({ darkMode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Recent Patients
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {patients.map((p, i) => (
          <div key={i} className="flex justify-between text-sm sm:text-base">
            <span className="truncate">{p.name}</span>
            <span className="text-gray-500">{p.age} yrs</span>
          </div>
        ))}
      </div>
    </div>
  );
}