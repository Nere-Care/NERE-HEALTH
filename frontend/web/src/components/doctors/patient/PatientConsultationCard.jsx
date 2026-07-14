import { CalendarDays, Clock3, User, FileText, Activity } from "lucide-react";

export default function PatientConsultationCard({ consultation = {}, darkMode }) {
  return (
    <div className={`flex flex-col border-2 rounded-2xl shadow p-4 sm:p-5 w-full transition hover:shadow-lg
      ${darkMode ? "bg-gray-900 border-green-500" : "bg-white border-green-600"}`}>

      <div>
        <h3 className={`text-sm sm:text-base font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
          {consultation.motif || "Consultation"}
        </h3>
        <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Consultation medicale
        </p>
      </div>

      <div className={`mt-4 flex flex-col sm:flex-row justify-between gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${darkMode ? "text-green-400" : "text-green-600"}`} />
          <span className="truncate">{consultation.diagnostic || "Diagnostic en attente"}</span>
        </div>
      </div>

      <div className={`mt-3 flex flex-col sm:flex-row sm:justify-between gap-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span>{consultation.date || "--"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4" />
          <span>{consultation.heure || "--"}</span>
        </div>
      </div>

      {consultation.notes && (
        <div className="mt-4">
          <div className={`flex items-start gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-2">{consultation.notes}</p>
          </div>
        </div>
      )}

      <button className={`w-full mt-4 py-2 rounded-lg text-sm transition
        ${darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
        Voir details
      </button>
    </div>
  );
}