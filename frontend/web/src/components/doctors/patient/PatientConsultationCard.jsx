import {
  CalendarDays,
  Clock3,
  User,
  FileText,
  Activity,
} from "lucide-react";

export default function PatientConsultationCard({ consultation = {} }) {
  return (
    <div
      className="
        bg-white flex flex-col  border-2 border-[#27772B]
        rounded-2xl shadow p-4 sm:p-5
        w-full transition hover:shadow-lg
      "
    >
      {/* TITLE */}
      <div>
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#2C3850]">
          {consultation.reason || "Consultation"}
        </h3>

        <p className="text-xs sm:text-sm font-light text-gray-500 mt-1">
          Medical Consultation
        </p>
      </div>

      {/* DOCTOR + DIAGNOSIS */}
      <div
        className="
          mt-4 flex flex-col justify-between w-full sm:flex-row
          sm:justify-between gap-2 sm:gap-0
          text-sm text-gray-600
        "
      >
        <div className="flex items-center gap-2 ">
          <User className="w-4 h-4" />
          <span>{consultation.doctor || "Unknown Doctor"}</span>
        </div>

        <div className="flex items-center gap-2 font-medium">
          <Activity className="w-4 h-4 text-[#27772B]" />
          <span>{consultation.diagnosis || "No diagnosis"}</span>
        </div>
      </div>

      {/* DATE + TIME */}
      <div
        className="
          mt-3 flex flex-col sm:flex-row
          sm:justify-between gap-2 sm:gap-0
          text-xs text-gray-500
        "
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          <span>{consultation.date || "--"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock3 className="w-4 h-4" />
          <span>{consultation.time || "--"}</span>
        </div>
      </div>

      {/* NOTES */}
      <div className="mt-4">
        <div className="flex items-start gap-2 text-gray-600 text-sm">
          <FileText className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="line-clamp-2">
            {consultation.notes || "No additional notes."}
          </p>
        </div>
      </div>

      {/* BUTTON */}
      <button
        className="
          w-full mt-4 bottom-0
          bg-[#044EEC] text-white
          py-2 rounded-lg
          hover:bg-[#033DCB] transition
          text-sm sm:text-base
        "
      >
        View details
      </button>
    </div>
  );
}