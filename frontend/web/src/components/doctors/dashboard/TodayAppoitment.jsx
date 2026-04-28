import { appointments } from "../../../constants/doctors/DasboardData";

export default function TodayAppointments({ darkMode }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm border transition-colors
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border text-black"}
    `}>
      <h2 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
        Today Appointments
      </h2>

      <div className="space-y-2 sm:space-y-3">
        {appointments.map((a, i) => (
          <div key={i} className="border rounded-xl p-3">
            <p className="font-medium text-sm sm:text-base">{a.patient}</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {a.time} • {a.type}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}