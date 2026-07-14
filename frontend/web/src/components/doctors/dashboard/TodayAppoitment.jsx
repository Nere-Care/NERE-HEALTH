import { Clock, Building2, FileText } from "lucide-react";

export default function TodayAppointments({ darkMode, appointments = [] }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300
      ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"}`}>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-sm sm:text-base">RDV du jour</h2>
        <span className="text-xs text-gray-400">{appointments.length} patient(s)</span>
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {appointments.length === 0 ? (
          <p className={`text-sm text-center py-8 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Aucun rendez-vous aujourd'hui
          </p>
        ) : (
          appointments.map((a, i) => (
            <div key={i} className={`rounded-xl p-3 border transition hover:shadow-md
              ${darkMode ? "bg-gray-900 border-gray-700 hover:bg-gray-800" : "bg-gray-50 border-gray-200 hover:bg-white"}`}>

              <div className="flex justify-between items-center gap-2">
                <p className="font-medium text-sm truncate">{a.patient}</p>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium shrink-0
                  ${a.type === "Teleconsultation" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                  {a.type}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{a.time}</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{a.clinic}</span>
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <FileText className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{a.reason}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}